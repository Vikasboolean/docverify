import axios from "axios";

/**
 * ============================================================================
 * DocVerify AI — API service layer
 * ============================================================================
 * This file is the single place that talks to the backend. Nothing else in
 * the app should hardcode a URL or call axios/fetch directly.
 *
 * Backend reference: https://github.com/yuvrajatr/sih26188 (FastAPI, port 8000)
 *
 * Endpoints THAT EXIST on the reference backend and are wired up for real:
 *   POST /extract-and-validate        -> uploadAndVerifyDocument()
 *   POST /match-face                  -> matchFace()
 *   GET  /verify-blockchain-anchor/:id-> verifyBlockchainAnchor()
 *   POST /generate-audit-report       -> generateAuditReport()
 *
 * Endpoints that DO NOT exist on the reference backend yet. Calling them
 * will fall back to a local-only implementation (browser storage) so the
 * UI keeps working end-to-end for a demo. Each is flagged with `mock: true`
 * in its return value and logged with a console.warn the first time it is
 * used, so it's obvious this is standing in for real persistence:
 *   - GET  /verification/:id          -> getVerificationResult()
 *   - GET  /verification/history      -> getVerificationHistory()
 *   - GET  /dashboard/stats           -> getDashboardStats()
 *   - POST /auth/login                -> login()
 *   - POST /auth/register             -> register()
 *   - POST /auth/logout               -> logout()
 *
 * To make the app fully live, add those routes to backend/main.py (a
 * verifications table/collection keyed by id, plus simple auth) and delete
 * the corresponding local-fallback branch below.
 * ============================================================================
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const http = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Attach auth token (if the local mock-auth flow issued one) to every request.
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("docverify_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Normalizes any axios error into a predictable, UI-friendly shape. */
function toApiError(error) {
  if (error.code === "ECONNABORTED") {
    return { type: "timeout", message: "The request timed out. The verification server may be under heavy load." };
  }
  if (error.message === "Network Error" || !error.response) {
    return {
      type: "network",
      message: `Unable to connect to the verification server at ${API_URL}. Confirm the backend is running.`,
    };
  }
  const status = error.response.status;
  const detail = error.response.data?.detail || error.response.data?.message;
  if (status === 413) {
    return { type: "file_too_large", message: "That file is too large for the server to accept." };
  }
  if (status === 415 || status === 400) {
    return { type: "invalid_file", message: detail || "That file could not be processed. Check the format and try again." };
  }
  if (status === 401) {
    return { type: "auth", message: "Your session has expired. Please sign in again." };
  }
  if (status >= 500) {
    return { type: "server", message: detail || "The verification server ran into an error processing this document." };
  }
  return { type: "unknown", message: detail || "Something went wrong while contacting the verification server." };
}

let warnedMock = new Set();
function warnMock(name) {
  if (!warnedMock.has(name)) {
    console.warn(
      `[DocVerify AI] "${name}" has no live endpoint on the reference backend yet — using local fallback data. See src/services/api.js.`
    );
    warnedMock.add(name);
  }
}

// ----------------------------------------------------------------------------
// Local fallback store (browser localStorage) — used only where noted above.
// ----------------------------------------------------------------------------
const HISTORY_KEY = "docverify_history";

function readLocalHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveToLocalHistory(record) {
  const history = readLocalHistory();
  history.unshift(record);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
}

// ----------------------------------------------------------------------------
// Result normalization
// ----------------------------------------------------------------------------

/**
 * The backend's real verdicts (AUTHENTIC / SUSPICIOUS / FAKE / REVOKED / ...)
 * are mapped to the four statuses the UI is built around. A second shape
 * (status/confidence/extractedText/indicators/metadata/analysis, as described
 * in the frontend brief) is also accepted so this keeps working if the
 * backend response contract changes.
 */
function mapVerdictToStatus(rawVerdict) {
  if (!rawVerdict) return "UNKNOWN";
  const v = String(rawVerdict).toUpperCase();
  if (["AUTHENTIC", "VALID", "MATCH", "GENUINE"].includes(v)) return "VALID";
  if (["SUSPICIOUS", "REVIEW", "NEEDS_REVIEW", "MANUAL_REVIEW"].includes(v)) return "SUSPICIOUS";
  if (["FAKE", "FORGED", "INVALID", "NO_MATCH", "REVOKED", "TAMPERED"].includes(v)) return "INVALID";
  return "UNKNOWN";
}

function pick(...vals) {
  return vals.find((v) => v !== undefined && v !== null);
}

export function normalizeVerificationResult(raw, meta = {}) {
  if (!raw) return null;

  const status = mapVerdictToStatus(pick(raw.verdict, raw.status));
  const confidence = Math.round(
    pick(raw.authenticity_score, raw.confidence_score, raw.confidence, 0) <= 1 &&
      pick(raw.authenticity_score, raw.confidence_score, raw.confidence, 0) > 0
      ? pick(raw.authenticity_score, raw.confidence_score, raw.confidence, 0) * 100
      : pick(raw.authenticity_score, raw.confidence_score, raw.confidence, 0)
  );

  const breakdown = {};
  if (raw.checksum_result) {
    breakdown["Algorithmic checksum"] = raw.checksum_result.passed ? 100 : 20;
  }
  if (raw.cross_check_result) {
    breakdown["Registry cross-check"] = raw.cross_check_result.passed ? 100 : 15;
  }
  if (raw.forensics || raw.ela_result) {
    const f = raw.forensics || raw.ela_result;
    breakdown["Visual / ELA consistency"] = Math.round(pick(f.score, f.sharpness_score, 0));
  }
  if (raw.analysis) {
    Object.entries(raw.analysis).forEach(([k, v]) => {
      if (typeof v === "number") breakdown[k] = Math.round(v <= 1 ? v * 100 : v);
    });
  }

  const indicators = [];
  (raw.validation_checks || []).forEach((c) => {
    indicators.push({
      label: c.name || c.check || "Check",
      passed: c.passed !== false,
      severity: c.passed === false ? "high" : "info",
      description: c.details || c.description || "",
      confidence: c.confidence ?? null,
    });
  });
  (raw.indicators || []).forEach((i) => {
    if (typeof i === "string") {
      indicators.push({ label: i, passed: false, severity: "medium", description: i, confidence: null });
    } else {
      indicators.push({
        label: i.label || i.name || "Indicator",
        passed: i.passed ?? false,
        severity: i.severity || "medium",
        description: i.description || "",
        confidence: i.confidence ?? null,
      });
    }
  });

  const extractedFields = raw.extracted_fields || raw.fields || null;
  const extractedText =
    raw.extracted_text ||
    raw.extractedText ||
    (Array.isArray(extractedFields)
      ? extractedFields.map((f) => `${f.field || f.label}: ${f.value}`).join("\n")
      : null);

  return {
    id: raw.id || raw.verification_id || raw.blockchain_anchor?.tx_hash || meta.localId || `local-${Date.now()}`,
    status,
    confidence: Number.isFinite(confidence) ? confidence : null,
    documentType: raw.document_type || raw.documentType || "Unknown",
    fileName: meta.fileName || raw.file_name || null,
    fileSize: meta.fileSize || null,
    uploadedAt: meta.uploadedAt || new Date().toISOString(),
    processingTimeMs: raw.processing_time_ms ?? null,
    assessmentText: buildAssessmentText(status),
    confidenceBreakdown: breakdown,
    indicators,
    extractedText: extractedText || null,
    extractedFields,
    checksumResult: raw.checksum_result || null,
    crossCheckResult: raw.cross_check_result || null,
    blockchainAnchor: raw.blockchain_anchor || null,
    metadata: raw.metadata || null,
    raw,
  };
}

function normalizeStoredVerification(raw) {
  return normalizeVerificationResult(raw, {
    fileName: raw.file_name,
    fileSize: raw.file_size,
    uploadedAt: raw.uploaded_at,
  });
}

function buildAssessmentText(status) {
  switch (status) {
    case "VALID":
      return "AI assessment: The document appears consistent with the analyzed checks.";
    case "SUSPICIOUS":
      return "AI assessment: Some characteristics require further verification.";
    case "INVALID":
      return "AI assessment: Multiple indicators suggest that the document may be manipulated or inconsistent.";
    default:
      return "AI assessment: Insufficient information for a confident assessment. Manual review recommended.";
  }
}

// ----------------------------------------------------------------------------
// Live endpoints
// ----------------------------------------------------------------------------

/**
 * Upload a document (and optional live face capture) and run the full
 * multi-pillar verification pipeline.
 * Backend: POST /extract-and-validate
 */
export async function uploadAndVerifyDocument(file, { liveFaceFile, onUploadProgress } = {}) {
  try {
    const form = new FormData();
    form.append("file", file);
    if (liveFaceFile) form.append("live_face", liveFaceFile);

    const { data } = await http.post("/extract-and-validate", form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    });

    const normalized = normalizeVerificationResult(data, {
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
    });

    // Cache locally so /history, /dashboard and /result/:id keep working
    // even though the backend does not yet persist verifications (see header).
    saveToLocalHistory(normalized);
    return { data: normalized, mock: false };
  } catch (error) {
    throw toApiError(error);
  }
}

/**
 * Dedicated 1:1 biometric face match against a document photo.
 * Backend: POST /match-face
 */
export async function matchFace(documentImageFile, liveFaceImageFile) {
  try {
    const form = new FormData();
    form.append("document_image", documentImageFile);
    form.append("live_face_image", liveFaceImageFile);
    const { data } = await http.post("/match-face", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { data, mock: false };
  } catch (error) {
    throw toApiError(error);
  }
}

/**
 * Independently verify a screening verdict against the blockchain audit ledger.
 * Backend: GET /verify-blockchain-anchor/:identifier
 */
export async function verifyBlockchainAnchor(identifier) {
  try {
    const { data } = await http.get(`/verify-blockchain-anchor/${encodeURIComponent(identifier)}`);
    return { data, mock: false };
  } catch (error) {
    throw toApiError(error);
  }
}

/**
 * Generate a downloadable PDF forensic audit certificate.
 * Backend: POST /generate-audit-report
 */
export async function generateAuditReport(payload) {
  try {
    const response = await http.post("/generate-audit-report", payload, {
      responseType: "blob",
    });
    return { data: response.data, mock: false };
  } catch (error) {
    throw toApiError(error);
  }
}

export async function downloadReport(verificationId) {
  try {
    const { data } = await generateAuditReport({ verification_id: verificationId });
    const url = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = `verigate-report-${verificationId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return { data, mock: false, unavailable: false };
  } catch {
    // Backend route not available in this environment — surface a clear signal.
    return { data: null, mock: true, unavailable: true };
  }
}

// ----------------------------------------------------------------------------
// Placeholder endpoints (no live backend route yet) — local fallback only.
// ----------------------------------------------------------------------------

/** PLACEHOLDER — backend needs: GET /verification/:id */
export async function getVerificationResult(id) {
  try {
    const { data } = await http.get(`/verification/${encodeURIComponent(id)}`);
    return { data: normalizeStoredVerification(data), mock: false };
  } catch (error) {
    throw toApiError(error);
  }
}

/** PLACEHOLDER — backend needs: GET /verification/history */
export async function getVerificationHistory() {
  try {
    const { data } = await http.get("/verification/history");
    return { data: data.map(normalizeStoredVerification), mock: false };
  } catch (error) {
    throw toApiError(error);
  }
}

/** PLACEHOLDER — backend needs: GET /dashboard/stats (aggregate query) */
export async function getDashboardStats() {
  try {
    const { data } = await http.get("/dashboard/stats");
    return {
      data: {
        ...data,
        recent: (data.recent || []).map(normalizeStoredVerification),
      },
      mock: false,
    };
  } catch (error) {
    throw toApiError(error);
  }
}

/** PLACEHOLDER — backend needs: POST /auth/login */
export async function login({ email, password }) {
  try {
    const { data } = await http.post("/auth/login", { email, password });
    localStorage.setItem("docverify_token", data.token);
    localStorage.setItem("docverify_user", JSON.stringify(data.user));
    return { data, mock: false };
  } catch (error) {
    throw toApiError(error);
  }
}

/** PLACEHOLDER — backend needs: POST /auth/register */
export async function register({ name, email, password }) {
  try {
    const { data } = await http.post("/auth/register", { name, email, password });
    localStorage.setItem("docverify_token", data.token);
    localStorage.setItem("docverify_user", JSON.stringify(data.user));
    return { data, mock: false };
  } catch (error) {
    throw toApiError(error);
  }
}

export function logout() {
  localStorage.removeItem("docverify_token");
  localStorage.removeItem("docverify_user");
}

export const isMockAuthActive = () => false;

export default {
  uploadAndVerifyDocument,
  matchFace,
  verifyBlockchainAnchor,
  generateAuditReport,
  downloadReport,
  getVerificationResult,
  getVerificationHistory,
  getDashboardStats,
  login,
  register,
  logout,
};
