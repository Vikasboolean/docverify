import { useState } from "react";
import { Copy, Check, ScanText } from "lucide-react";
import { useToast } from "../context/ToastContext";

const PREVIEW_LENGTH = 320;

/** Strips characters that have no business being rendered as plain text. */
function sanitize(text) {
  return String(text).replace(/[<>]/g, "");
}

export default function OCRResult({ text, fields }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const clean = text ? sanitize(text) : "";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(clean);
      setCopied(true);
      toast.success("Extracted text copied.");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy text — copy it manually instead.");
    }
  }

  return (
    <div className="card card-pad">
      <div className="row-8" style={{ justifyContent: "space-between", marginBottom: 4 }}>
        <div className="row-8">
          <ScanText size={18} className="text-soft" />
          <h3 style={{ fontSize: "1.05rem" }}>OCR analysis</h3>
        </div>
        {clean && (
          <button className="btn btn-ghost btn-sm" onClick={handleCopy}>
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy text"}
          </button>
        )}
      </div>
      <p className="text-soft text-sm" style={{ marginBottom: 14 }}>Text extracted from the document by the OCR engine.</p>

      {clean ? (
        <>
          <pre className="ocr-text">{expanded ? clean : clean.slice(0, PREVIEW_LENGTH)}</pre>
          {clean.length > PREVIEW_LENGTH && (
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => setExpanded((e) => !e)}>
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </>
      ) : (
        <p className="text-soft text-sm">No extracted text was returned for this document.</p>
      )}

      {fields && Array.isArray(fields) && fields.length > 0 && (
        <div className="ocr-fields">
          {fields.map((f, i) => (
            <div key={i} className="ocr-field-row">
              <span className="text-soft text-sm">{f.field || f.label}</span>
              <span className="mono text-sm">{f.value || "Not available"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
