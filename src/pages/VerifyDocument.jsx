import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw, ScanSearch, AlertTriangle } from "lucide-react";
import UploadBox from "../components/UploadBox";
import CameraCapture from "../components/CameraCapture";
import DocumentPreview from "../components/DocumentPreview";
import VerificationProgress from "../components/VerificationProgress";
import { uploadAndVerifyDocument } from "../services/api";
import { useToast } from "../context/ToastContext";

export default function VerifyDocument() {
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState("");
  const [uploadedAt, setUploadedAt] = useState(null);
  const [stage, setStage] = useState("idle"); // idle | processing | error
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  function handleFileAccepted(f) {
    setFile(f);
    setUploadedAt(new Date().toISOString());
    setError(null);
  }

  function handleRemove() {
    setFile(null);
    setUploadedAt(null);
    setError(null);
    setStage("idle");
  }

  async function handleAnalyze() {
    if (!file) return;
    setStage("processing");
    setError(null);
    try {
      const { data } = await uploadAndVerifyDocument(file);
      toast.success("Verification completed.");
      navigate(`/result/${data.id}`, { state: { result: data } });
    } catch (err) {
      setStage("error");
      setError(err.message || "Verification failed. Please try again.");
      toast.error(err.message || "Unable to connect to verification server.");
    }
  }

  return (
    <div className="app-main-inner">
      <div className="page-head">
        <h1>Verify your document</h1>
        <p>Upload a clear scan or photo and VeriGate will run its full analysis pipeline.</p>
      </div>

      {!file && (
        <div className="verify-source-grid">
          <div className="card card-pad">
            <div className="field">
              <label htmlFor="document-type">Document type</label>
              <select id="document-type" value={documentType} onChange={(event) => setDocumentType(event.target.value)}>
                <option value="">Select document type</option>
                <option>Aadhaar Card</option>
                <option>PAN Card</option>
                <option>Driving Licence</option>
                <option>Passport</option>
                <option>10th Marksheet</option>
                <option>12th Marksheet</option>
              </select>
            </div>
            <UploadBox onFileAccepted={handleFileAccepted} onError={(msg) => toast.error(msg)} />
          </div>
          <CameraCapture onFileCaptured={handleFileAccepted} onError={(msg) => toast.error(msg)} />
        </div>
      )}

      {file && stage === "idle" && (
        <div className="stack-16" style={{ maxWidth: 640 }}>
          <div className="card card-pad">
            <DocumentPreview file={file} uploadedAt={uploadedAt} onRemove={handleRemove} />
          </div>
          <div className="row-12">
            <button className="btn btn-primary" onClick={handleAnalyze}>
              <ScanSearch size={17} /> Analyze document
            </button>
            <button className="btn btn-outline" onClick={handleRemove}>Remove</button>
          </div>
        </div>
      )}

      {stage === "processing" && (
        <div className="card card-pad" style={{ maxWidth: 640 }}>
          <VerificationProgress />
        </div>
      )}

      {stage === "error" && (
        <div className="stack-16" style={{ maxWidth: 640 }}>
          <div className="card card-pad error-panel">
            <AlertTriangle size={22} className="text-invalid" />
            <div>
              <p style={{ fontWeight: 600 }}>Verification failed</p>
              <p className="text-soft text-sm">{error}</p>
            </div>
          </div>
          <div className="row-12">
            <button className="btn btn-primary" onClick={handleAnalyze}>
              <RotateCcw size={16} /> Try again
            </button>
            <button className="btn btn-outline" onClick={handleRemove}>Upload another</button>
          </div>
        </div>
      )}
    </div>
  );
}
