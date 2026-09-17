# VeriGate backend

This FastAPI service is the backend for the frontend in this repository. It persists users and verification records in `backend/data/verigate.db`; that runtime database is ignored by Git.

## Run locally

From the repository root, install the dependencies once:

```powershell
npm install
python -m pip install -r backend/requirements.txt
```

Then start both services with one command:

```powershell
npm run dev
```

The frontend is available at `http://localhost:5173`. The API is available at `http://localhost:8000`; interactive API documentation is at `http://localhost:8000/docs`.

The frontend's `.env` should contain:

```env
VITE_API_URL=http://localhost:8000
```

Before deployment, copy `.env.example` to `.env`, set a long random `VERIGATE_SECRET`, and restrict `ALLOWED_ORIGINS` to the deployed frontend URL. Origins must be exact and **must not include a trailing slash** (for example, `https://docverify-seven.vercel.app`, not `https://docverify-seven.vercel.app/`).

## Deploying the frontend and API separately

`VITE_API_URL` is embedded in the frontend at build time. In the frontend host's environment-variable settings, set it to the public API base URL (for example, `https://docverify-pjff.onrender.com`), then redeploy the frontend. On the API host, set `ALLOWED_ORIGINS` to the frontend URL without a trailing slash and redeploy the API. Confirm the API is live by opening `<VITE_API_URL>/health`; it must return `{"status":"ok"}` before uploads can work.

## What it implements

- Account registration, login, and signed bearer tokens
- Authenticated verification result, history, and dashboard routes backed by SQLite
- Upload validation for JPG, PNG, and PDF files up to 10 MB
- SHA-256 integrity hashes, local audit anchors, and PDF audit reports

The current document screening is only a transparent file-level heuristic: it checks whether a file's binary signature matches its extension and records an integrity hash. It is not OCR, face matching, registry validation, image forensics, blockchain anchoring, or a legal determination of authenticity. Connect approved specialist services in `analyse_document` before using it for consequential decisions.

For start the backend
you should use command "cd backend" to move on the file.
then use "python -m uvicorn main:app --reload --port 8000" commend to run the backend 
