# veri_gate AI — Frontend

AI-powered document verification & fraud detection frontend, built to connect to the
[sih26188](https://github.com/yuvrajatr/sih26188) FastAPI backend (React + Vite + JavaScript, no TypeScript).

## 1. Install & run

```bash
npm install
npm run dev
```

`npm run dev` starts both the frontend and the included backend. The app runs at `http://localhost:5173`.

To build for production:

```bash
npm run build
npm run preview
```

## 2. Environment variables

Copy `.env.example` to `.env` and point it at your running backend:

```
VITE_API_URL=http://localhost:8000
```

The reference backend (`sih26188/backend`) runs on **port 8000** via
`uvicorn main:app --reload --port 8000`, not port 5000 — the env var default here matches that.

## 3. Backend endpoints used

| Endpoint | Method | Used by | Status |
|---|---|---|---|
| `/extract-and-validate` | POST | Verify Document page | ✅ Wired to the real backend route |
| `/match-face` | POST | `matchFace()` in `src/services/api.js` (ready to call from a biometric step if you add one) | ✅ Wired to the real backend route |
| `/verify-blockchain-anchor/:identifier` | GET | Reports page ("Verify a blockchain anchor") | ✅ Wired to the real backend route |
| `/generate-audit-report` | POST | "Download report" buttons | ✅ Wired to the real backend route |
| `/verification/:id` | GET | Result page (direct link / refresh) | ⚠️ Placeholder — backend doesn't persist verifications yet, so this reads from a local browser cache instead. Add this route (persist the response of `/extract-and-validate` keyed by an id) to make results shareable and durable. |
| `/verification/history` | GET | History page | ⚠️ Placeholder — same local cache as above. |
| `/dashboard/stats` | GET | Dashboard page | ⚠️ Placeholder — aggregated client-side from the local cache. |
| `/auth/login`, `/auth/register` | POST | Login / Register pages | ⚠️ Placeholder — the reference backend has no auth routes. A local demo auth flow (stored in `localStorage`) is used so the UI is fully functional; swap in real calls once the backend adds auth. |

Every placeholder is implemented in **`src/services/api.js`**, clearly commented, and logs a
`console.warn` the first time it's used. The UI also shows a small "this is local demo data" banner
(`MockBanner`) anywhere placeholder data is displayed, per the "no fake data in production flow" requirement.

## 4. How the verify → result flow works

1. **`/verify`** — the person drags in or browses to a JPG/PNG/PDF. `UploadBox` validates type and size
   client-side (`src/utils/helpers.js`), then `DocumentPreview` shows the file, its size, and upload time.
2. Clicking **Analyze document** calls `uploadAndVerifyDocument()`, which `POST`s the file as
   `multipart/form-data` to `/extract-and-validate`. While the request is in flight, `VerificationProgress`
   steps through the pipeline stages for context — it does not fabricate a result; the real response drives
   what's shown next.
3. The raw backend response is passed through `normalizeVerificationResult()`, which:
   - Maps the backend's verdict (`AUTHENTIC` / `SUSPICIOUS` / `FAKE` / ...) to the four UI statuses
     (`VALID` / `SUSPICIOUS` / `INVALID` / `UNKNOWN`).
   - Pulls out whatever breakdown fields the backend provided (checksum, cross-check, forensics/ELA,
     `analysis.*`) into a confidence breakdown — if the backend only returns one overall score, the UI says
     "Detailed breakdown unavailable" rather than inventing numbers.
   - Leaves anything the backend didn't return as `null`/`"Not available"` (metadata, OCR text, etc.) — nothing
     is invented.
4. The normalized result is cached locally (see the placeholder note above) and the browser navigates to
   **`/result/:id`**, which renders `ResultCard`, `ConfidenceScore`, `FraudIndicators`, `OCRResult`, and
   `MetadataCard` from that data.
5. **History**, **Dashboard**, and **Reports** all read from the same local cache until the backend exposes
   persistence/aggregate endpoints.

## 5. Required backend changes for full integration

To remove every `MockBanner` in the app:

1. Persist each `/extract-and-validate` response with a stable id (DB row or even a JSON file keyed by id).
2. Add `GET /verification/:id` and `GET /verification/history` reading from that store.
3. Add `GET /dashboard/stats` returning aggregate counts (and ideally a time series for activity-over-time).
4. Add `POST /auth/register`, `POST /auth/login`, and `GET /auth/me` (JWT or session based) if you want real
   accounts instead of the local demo login.

None of this requires changing the existing verification pipeline (OCR, checksum, ELA, biometric matching,
blockchain anchoring, PDF report generation) — it's purely additive persistence/auth around it.

## 6. Project structure

```
src/
├── components/   UploadBox, DocumentPreview, VerificationProgress, ResultCard,
│                 ConfidenceScore, FraudIndicators, OCRResult, MetadataCard,
│                 Navbar, Sidebar, ProtectedRoute, Layouts, MockBanner, Footer
├── pages/        Home, Login, Register, Dashboard, VerifyDocument,
│                 VerificationResult, History, Reports, Profile, NotFound
├── services/     api.js — the only place that calls the backend
├── context/      AuthContext, ToastContext
├── utils/        helpers.js — formatting, validation, status metadata
├── App.jsx, main.jsx, index.css, app.css
```

## 7. Security notes implemented in the frontend

- File type/extension and size are validated before upload.
- Extracted OCR text is stripped of `<`/`>` before rendering (defense in depth alongside React's own escaping).
- No API keys or secrets live in the frontend; only `VITE_API_URL` is configurable.
- The demo auth token is a local placeholder, never a real credential, and is clearly labeled as such.
- Every result screen states this is an **AI-assisted risk assessment**, never a legal determination of
  authenticity.
