import { useCallback, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { ACCEPTED_EXTENSIONS, MAX_FILE_SIZE_MB, validateFile } from "../utils/helpers";

export default function UploadBox({ onFileAccepted, onError }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = useCallback(
    (fileList) => {
      const file = fileList?.[0];
      if (!file) return;
      const result = validateFile(file);
      if (!result.valid) {
        onError?.(result.error);
        return;
      }
      onFileAccepted(file);
    },
    [onFileAccepted, onError]
  );

  return (
    <div
      className={"upload-box" + (dragging ? " upload-box-active" : "")}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(",")}
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="upload-box-icon">
        <UploadCloud size={30} />
      </div>
      <p className="upload-box-title">Drag & drop your document here</p>
      <p className="text-soft text-sm" style={{ marginTop: 4 }}>
        or <span className="upload-box-browse">browse files</span>
      </p>
      <p className="text-faint text-sm" style={{ marginTop: 14 }}>
        Supports JPG, JPEG, PNG, PDF · Max {MAX_FILE_SIZE_MB}MB
      </p>
    </div>
  );
}
