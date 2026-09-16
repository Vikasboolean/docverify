import { useEffect, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import { Download, Link2, FileText } from "lucide-react";
import ResultCard from "../components/ResultCard";
import ConfidenceScore from "../components/ConfidenceScore";
import FraudIndicators from "../components/FraudIndicators";
import OCRResult from "../components/OCRResult";
import MetadataCard from "../components/MetadataCard";
import { getVerificationResult, downloadReport } from "../services/api";
import { formatBytes, formatDate } from "../utils/helpers";
import { useToast } from "../context/ToastContext";

export default function VerificationResult() {
  const { id } = useParams();
  const location = useLocation();
  const toast = useToast();
  const [result, setResult] = useState(location.state?.result || null);
  const [loading, setLoading] = useState(!location.state?.result);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (result) return;
    let active = true;
    (async () => {
      setLoading(true);
      const { data } = await getVerificationResult(id);
      if (!active) return;
      if (data) setResult(data);
      else setNotFound(true);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id, result]);

  async function handleDownload() {
    const { unavailable } = await downloadReport(id);
    if (unavailable) {
      toast.info("PDF report generation isn't reachable from this environment — connect the backend's /generate-audit-report endpoint to enable downloads.");
    } else {
      toast.success("Report downloaded.");
    }
  }

  if (loading) {
    return (
      <div className="app-main-inner">
        <div className="skel" style={{ height: 320, marginBottom: 20, borderRadius: 18 }} />
        <div className="skel" style={{ height: 160, borderRadius: 18 }} />
      </div>
    );
  }

  if (notFound || !result) {
    return (
      <div className="app-main-inner">
        <div className="empty-state card card-pad">
          <FileText className="empty-icon" />
          <h3>Result not found</h3>
          <p>We couldn't find a verification with id "{id}". It may have expired from local storage.</p>
          <Link to="/verify" className="btn btn-primary" style={{ marginTop: 16 }}>Verify a document</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-main-inner">
      <div className="page-head page-head-row">
        <div>
          <h1>Verification result</h1>
          <p className="mono text-sm text-soft">ID {result.id}</p>
        </div>
        <div className="row-12">
          <button className="btn btn-outline btn-sm" onClick={handleDownload}>
            <Download size={15} /> Download report
          </button>
          {result.blockchainAnchor?.tx_hash && (
            <Link to={`/reports?anchor=${result.blockchainAnchor.tx_hash}`} className="btn btn-outline btn-sm">
              <Link2 size={15} /> Verify anchor
            </Link>
          )}
        </div>
      </div>

      <div className="result-layout">
        <ResultCard
          status={result.status}
          confidence={result.confidence}
          assessmentText={result.assessmentText}
          documentType={result.documentType}
        />

        <div className="card card-pad">
          <h3 style={{ fontSize: "1.05rem", marginBottom: 16 }}>Document information</h3>
          <dl className="meta-grid">
            <div className="meta-grid-row">
              <dt className="text-soft text-sm">Document type</dt>
              <dd>{result.documentType || "Not available"}</dd>
            </div>
            <div className="meta-grid-row">
              <dt className="text-soft text-sm">File name</dt>
              <dd style={{ wordBreak: "break-word" }}>{result.fileName || "Not available"}</dd>
            </div>
            <div className="meta-grid-row">
              <dt className="text-soft text-sm">File size</dt>
              <dd>{result.fileSize ? formatBytes(result.fileSize) : "Not available"}</dd>
            </div>
            <div className="meta-grid-row">
              <dt className="text-soft text-sm">Upload date</dt>
              <dd>{formatDate(result.uploadedAt)}</dd>
            </div>
            {result.processingTimeMs != null && (
              <div className="meta-grid-row">
                <dt className="text-soft text-sm">Processing time</dt>
                <dd className="mono">{Math.round(result.processingTimeMs)} ms</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="result-detail-grid">
        <ConfidenceScore overall={result.confidence} breakdown={result.confidenceBreakdown} />
        <FraudIndicators indicators={result.indicators} />
        <OCRResult text={result.extractedText} fields={result.extractedFields} />
        <MetadataCard metadata={result.metadata} />
      </div>
    </div>
  );
}
