"""VeriGate API: a local, persistent backend for the React frontend.

The verification analysis in this starter backend is deliberately heuristic. It
validates the upload, records file metadata and a SHA-256 audit hash; it does
not claim to prove that a document is authentic. Replace `analyse_document`
with approved OCR, registry and forensic services for a production deployment.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import sqlite3
import time
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, EmailStr, Field
from dotenv import load_dotenv

APP_DIR = Path(__file__).resolve().parent
load_dotenv(APP_DIR / ".env")
DATA_DIR = APP_DIR / "data"
DB_PATH = DATA_DIR / "verigate.db"
MAX_FILE_BYTES = 10 * 1024 * 1024
ALLOWED_MEDIA_TYPES = {"image/jpeg", "image/png", "application/pdf"}
ALLOWED_SUFFIXES = {".jpg", ".jpeg", ".png", ".pdf"}
SECRET = os.getenv("VERIGATE_SECRET", "development-only-change-me").encode()
TOKEN_TTL_HOURS = 24

app = FastAPI(title="VeriGate API", version="1.0.0")
# Browser Origin headers never include a trailing slash. Normalizing here keeps
# a harmless trailing slash in a host environment variable from breaking every
# browser request with a CORS network error.
origins = [
    origin.strip().rstrip("/")
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def db() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def setup_database() -> None:
    with db() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS verifications (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                file_name TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                uploaded_at TEXT NOT NULL,
                document_type TEXT NOT NULL,
                verdict TEXT NOT NULL,
                confidence INTEGER NOT NULL,
                processing_time_ms INTEGER NOT NULL,
                checksum TEXT NOT NULL,
                anchor_hash TEXT NOT NULL UNIQUE,
                result_json TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id)
            );
            CREATE INDEX IF NOT EXISTS idx_verifications_user_date
                ON verifications(user_id, uploaded_at DESC);
            """
        )


@app.on_event("startup")
def startup() -> None:
    setup_database()


def password_hash(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 310_000)
    return f"{base64.urlsafe_b64encode(salt).decode()}${base64.urlsafe_b64encode(digest).decode()}"


def password_matches(password: str, stored: str) -> bool:
    try:
        salt_encoded, digest_encoded = stored.split("$", 1)
        actual = password_hash(password, base64.urlsafe_b64decode(salt_encoded)).split("$", 1)[1]
        return hmac.compare_digest(actual, digest_encoded)
    except (ValueError, TypeError):
        return False


def token_for(user_id: str) -> str:
    payload = {"sub": user_id, "exp": int((datetime.now(timezone.utc) + timedelta(hours=TOKEN_TTL_HOURS)).timestamp())}
    encoded = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).decode().rstrip("=")
    signature = hmac.new(SECRET, encoded.encode(), hashlib.sha256).hexdigest()
    return f"{encoded}.{signature}"


def user_from_token(authorization: str | None = Header(default=None)) -> dict[str, str] | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        encoded, signature = authorization.removeprefix("Bearer ").split(".", 1)
        expected = hmac.new(SECRET, encoded.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected):
            raise ValueError("signature")
        payload = json.loads(base64.urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4)))
        if payload["exp"] < int(time.time()):
            raise ValueError("expired")
        with db() as connection:
            row = connection.execute("SELECT id, name, email FROM users WHERE id = ?", (payload["sub"],)).fetchone()
        return dict(row) if row else None
    except (ValueError, KeyError, json.JSONDecodeError):
        return None


def require_user(user: dict[str, str] | None = Depends(user_from_token)) -> dict[str, str]:
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sign in to use this endpoint.")
    return user


def optional_user_id(user: dict[str, str] | None = Depends(user_from_token)) -> str | None:
    return user["id"] if user else None


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=256)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=256)


class ReportRequest(BaseModel):
    verification_id: str


def assessment(verdict: str) -> str:
    if verdict == "AUTHENTIC":
        return "Heuristic screening found no file-level anomalies. This is not a legal determination of authenticity."
    return "This file needs manual review. The result is a heuristic risk assessment, not a legal determination."


def analyse_document(content: bytes, upload: UploadFile, verification_id: str) -> dict[str, Any]:
    """Return transparent, file-level checks without inventing OCR or registry data."""
    suffix = Path(upload.filename or "").suffix.lower()
    media_type = upload.content_type or "application/octet-stream"
    file_hash = hashlib.sha256(content).hexdigest()
    signature_ok = (
        (suffix in {".jpg", ".jpeg"} and content.startswith(b"\xff\xd8\xff"))
        or (suffix == ".png" and content.startswith(b"\x89PNG\r\n\x1a\n"))
        or (suffix == ".pdf" and content.startswith(b"%PDF-"))
    )
    indicators: list[dict[str, Any]] = [
        {
            "label": "File signature",
            "passed": signature_ok,
            "severity": "info" if signature_ok else "high",
            "description": "The binary signature matches the uploaded file extension." if signature_ok else "The file signature does not match its extension.",
        },
        {
            "label": "Integrity hash",
            "passed": True,
            "severity": "info",
            "description": "A SHA-256 hash was recorded for this uploaded file.",
        },
    ]
    verdict = "AUTHENTIC" if signature_ok else "SUSPICIOUS"
    confidence = 65 if signature_ok else 25
    anchor_hash = "0x" + hashlib.sha256(f"{verification_id}:{file_hash}".encode()).hexdigest()
    document_type = "PDF document" if suffix == ".pdf" else "Image document"
    return {
        "id": verification_id,
        "verdict": verdict,
        "authenticity_score": confidence,
        "document_type": document_type,
        "processing_time_ms": 0,
        "validation_checks": indicators,
        "checksum_result": {"passed": signature_ok, "algorithm": "SHA-256", "hash": file_hash},
        "cross_check_result": None,
        "extracted_text": None,
        "extracted_fields": None,
        "metadata": {"content_type": media_type, "extension": suffix or "Not available", "sha256": file_hash, "byte_size": len(content)},
        "blockchain_anchor": {"tx_hash": anchor_hash, "network": "local audit ledger", "anchored_at": now()},
        "assessment": assessment(verdict),
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/auth/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest) -> dict[str, Any]:
    user_id = str(uuid.uuid4())
    user = {"id": user_id, "name": payload.name.strip(), "email": str(payload.email).lower()}
    try:
        with db() as connection:
            connection.execute("INSERT INTO users VALUES (?, ?, ?, ?, ?)", (user_id, user["name"], user["email"], password_hash(payload.password), now()))
    except sqlite3.IntegrityError as exc:
        raise HTTPException(status_code=409, detail="An account with this email already exists.") from exc
    return {"token": token_for(user_id), "user": user}


@app.post("/auth/login")
def login(payload: LoginRequest) -> dict[str, Any]:
    with db() as connection:
        row = connection.execute("SELECT id, name, email, password_hash FROM users WHERE email = ?", (str(payload.email).lower(),)).fetchone()
    if not row or not password_matches(payload.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
    user = {"id": row["id"], "name": row["name"], "email": row["email"]}
    return {"token": token_for(user["id"]), "user": user}


@app.get("/auth/me")
def me(user: dict[str, str] = Depends(require_user)) -> dict[str, str]:
    return user


@app.post("/extract-and-validate")
async def extract_and_validate(file: UploadFile = File(...), user_id: str | None = Depends(optional_user_id)) -> dict[str, Any]:
    suffix = Path(file.filename or "").suffix.lower()
    if file.content_type not in ALLOWED_MEDIA_TYPES and suffix not in ALLOWED_SUFFIXES:
        raise HTTPException(status_code=415, detail="Upload a JPG, PNG, or PDF file.")
    content = await file.read(MAX_FILE_BYTES + 1)
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(content) > MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds the 10 MB limit.")
    started = time.perf_counter()
    verification_id = str(uuid.uuid4())
    result = analyse_document(content, file, verification_id)
    result["processing_time_ms"] = round((time.perf_counter() - started) * 1000)
    stored = {**result, "file_name": file.filename, "file_size": len(content), "uploaded_at": now()}
    with db() as connection:
        connection.execute(
            "INSERT INTO verifications VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (verification_id, user_id, file.filename or "document", len(content), stored["uploaded_at"], result["document_type"], result["verdict"], result["authenticity_score"], result["processing_time_ms"], result["checksum_result"]["hash"], result["blockchain_anchor"]["tx_hash"], json.dumps(stored)),
        )
    return result


def result_for_row(row: sqlite3.Row) -> dict[str, Any]:
    return json.loads(row["result_json"])


@app.get("/verification/history")
def verification_history(user: dict[str, str] = Depends(require_user)) -> list[dict[str, Any]]:
    with db() as connection:
        rows = connection.execute("SELECT * FROM verifications WHERE user_id = ? ORDER BY uploaded_at DESC", (user["id"],)).fetchall()
    return [result_for_row(row) for row in rows]


@app.get("/verification/{verification_id}")
def get_verification(verification_id: str, user: dict[str, str] = Depends(require_user)) -> dict[str, Any]:
    with db() as connection:
        row = connection.execute("SELECT * FROM verifications WHERE id = ? AND user_id = ?", (verification_id, user["id"])).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Verification not found.")
    return result_for_row(row)


@app.get("/dashboard/stats")
def dashboard_stats(user: dict[str, str] = Depends(require_user)) -> dict[str, Any]:
    records = verification_history(user)
    counts = {"total": len(records), "valid": 0, "suspicious": 0, "invalid": 0, "unknown": 0}
    mapping = {"AUTHENTIC": "valid", "SUSPICIOUS": "suspicious", "FAKE": "invalid"}
    for record in records:
        counts[mapping.get(record["verdict"], "unknown")] += 1
    return {**counts, "recent": records[:8]}


@app.get("/verify-blockchain-anchor/{identifier}")
def verify_anchor(identifier: str) -> dict[str, Any]:
    with db() as connection:
        row = connection.execute("SELECT id, anchor_hash, checksum, uploaded_at FROM verifications WHERE anchor_hash = ?", (identifier,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Audit anchor was not found.")
    return {"verified": True, "verification_id": row["id"], "anchor": row["anchor_hash"], "sha256": row["checksum"], "recorded_at": row["uploaded_at"], "network": "local audit ledger"}


def pdf_escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def simple_pdf(lines: list[str]) -> bytes:
    content = "BT\n/F1 12 Tf\n50 760 Td\n" + "\n".join(f"({pdf_escape(line)}) Tj\n0 -20 Td" for line in lines) + "\nET"
    objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>", f"<< /Length {len(content.encode())} >>\nstream\n{content}\nendstream", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"]
    output = "%PDF-1.4\n"
    offsets = [0]
    for index, obj in enumerate(objects, 1):
        offsets.append(len(output.encode()))
        output += f"{index} 0 obj\n{obj}\nendobj\n"
    xref = len(output.encode())
    output += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n" + "".join(f"{offset:010d} 00000 n \n" for offset in offsets[1:])
    output += f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF"
    return output.encode()


@app.post("/generate-audit-report")
def generate_audit_report(payload: ReportRequest, user: dict[str, str] = Depends(require_user)) -> Response:
    with db() as connection:
        row = connection.execute("SELECT * FROM verifications WHERE id = ? AND user_id = ?", (payload.verification_id, user["id"])).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Verification not found.")
    record = result_for_row(row)
    lines = ["VeriGate verification report", f"Verification ID: {record['id']}", f"File: {row['file_name']}", f"Verdict: {record['verdict']}", f"Heuristic confidence: {record['authenticity_score']}%", f"SHA-256: {row['checksum']}", f"Audit anchor: {row['anchor_hash']}", "This is an AI-assisted heuristic assessment, not a legal determination."]
    return Response(content=simple_pdf(lines), media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="verigate-report-{record["id"]}.pdf"'})
