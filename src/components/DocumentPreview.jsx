import { useEffect, useState } from "react";
import { FileText, X } from "lucide-react";
import { formatBytes, formatDate } from "../utils/helpers";

export default function DocumentPreview({ file, uploadedAt, onRemove }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="doc-preview">
      <div className="doc-preview-media">
        {isPdf ? (
          previewUrl && <embed src={previewUrl} type="application/pdf" className="doc-preview-pdf" />
        ) : (
          previewUrl && <img src={previewUrl} alt={`Preview of ${file.name}`} className="doc-preview-img" />
        )}
        <button className="doc-preview-remove" onClick={onRemove} aria-label="Remove document">
          <X size={16} />
        </button>
      </div>

      <div className="doc-preview-info">
        <div className="row-12">
          <FileText size={18} className="text-soft" />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 600, wordBreak: "break-word" }}>{file.name}</p>
          </div>
        </div>
        <dl className="doc-preview-meta">
          <div>
            <dt>File type</dt>
            <dd>{isPdf ? "PDF document" : file.type || "Image"}</dd>
          </div>
          <div>
            <dt>File size</dt>
            <dd>{formatBytes(file.size)}</dd>
          </div>
          <div>
            <dt>Upload time</dt>
            <dd>{formatDate(uploadedAt)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
