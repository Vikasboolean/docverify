import { ShieldCheck, ShieldAlert, ShieldX, ShieldQuestion } from "lucide-react";
import { statusMeta } from "../utils/helpers";

const ICONS = {
  VALID: ShieldCheck,
  SUSPICIOUS: ShieldAlert,
  INVALID: ShieldX,
  MANUAL_REVIEW: ShieldQuestion,
  UNKNOWN: ShieldQuestion,
};

export default function ResultCard({ status, confidence, assessmentText, documentType }) {
  const meta = statusMeta(status);
  const Icon = ICONS[status] || ShieldQuestion;

  return (
    <div className={`result-card result-card-${status?.toLowerCase() || "unknown"}`}>
      <div className="result-card-icon">
        <Icon size={40} strokeWidth={1.8} />
      </div>
      <p className="result-card-eyebrow">Document status</p>
      <h1 className="result-card-status">{meta.label}</h1>
      <p className="result-card-summary">{meta.summary}</p>

      {confidence != null && (
        <div className="result-card-confidence">
          <span className="result-card-confidence-value">{confidence}%</span>
          <span className="text-soft text-sm">AI confidence</span>
        </div>
      )}

      <p className="result-card-assessment">{assessmentText}</p>

      {documentType && documentType !== "Unknown" && (
        <span className="badge badge-unknown" style={{ marginTop: 12 }}>{documentType}</span>
      )}
    </div>
  );
}
