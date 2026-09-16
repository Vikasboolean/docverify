import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Download, FileBarChart2, Link2, Search } from "lucide-react";
import { getVerificationHistory, downloadReport, verifyBlockchainAnchor } from "../services/api";
import { formatDate, statusMeta } from "../utils/helpers";
import { useToast } from "../context/ToastContext";

export default function Reports() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [anchorId, setAnchorId] = useState("");
  const [anchorResult, setAnchorResult] = useState(null);
  const [anchorLoading, setAnchorLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const toast = useToast();

  useEffect(() => {
    (async () => {
      const { data } = await getVerificationHistory();
      setRecords(data);
      setSelected(data[0] || null);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const fromQuery = searchParams.get("anchor");
    if (fromQuery) {
      setAnchorId(fromQuery);
      handleAnchorLookup(fromQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function handleAnchorLookup(idOverride) {
    const id = idOverride || anchorId;
    if (!id) return;
    setAnchorLoading(true);
    setAnchorResult(null);
    try {
      const { data } = await verifyBlockchainAnchor(id);
      setAnchorResult({ ok: true, data });
    } catch (err) {
      setAnchorResult({ ok: false, message: err.message });
    } finally {
      setAnchorLoading(false);
    }
  }

  async function handleDownload(id) {
    const { unavailable } = await downloadReport(id);
    if (unavailable) {
      toast.info("Connect the backend's /generate-audit-report endpoint to enable PDF downloads.");
    } else {
      toast.success("Report downloaded.");
    }
  }

  return (
    <div className="app-main-inner">
      <div className="page-head">
        <h1>Reports</h1>
        <p>Review full verification reports and independently check a blockchain audit anchor.</p>
      </div>

      <div className="card card-pad" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: "1.05rem", marginBottom: 4 }}>Verify a blockchain anchor</h3>
        <p className="text-soft text-sm" style={{ marginBottom: 14 }}>
          Paste a transaction hash, block number, or verdict hash to independently confirm a verdict wasn't altered
          after issuance.
        </p>
        <div className="row-12" style={{ flexWrap: "wrap" }}>
          <div className="search-input" style={{ flex: 1, minWidth: 220 }}>
            <Search size={16} />
            <input
              placeholder="e.g. 0xa4f28c1..."
              value={anchorId}
              onChange={(e) => setAnchorId(e.target.value)}
              className="mono"
            />
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => handleAnchorLookup()} disabled={!anchorId || anchorLoading}>
            <Link2 size={15} /> {anchorLoading ? "Checking…" : "Check anchor"}
          </button>
        </div>
        {anchorResult && (
          <div className={`anchor-result ${anchorResult.ok ? "anchor-ok" : "anchor-fail"}`} style={{ marginTop: 14 }}>
            {anchorResult.ok ? (
              <pre className="mono text-sm">{JSON.stringify(anchorResult.data, null, 2)}</pre>
            ) : (
              <p className="text-sm">{anchorResult.message}</p>
            )}
          </div>
        )}
      </div>

      <div className="reports-layout">
        <div className="card card-pad reports-list">
          <h3 style={{ fontSize: "1.05rem", marginBottom: 14 }}>Recent reports</h3>
          {loading ? (
            <div className="stack-12">{[1, 2, 3].map((i) => <div key={i} className="skel" style={{ height: 48 }} />)}</div>
          ) : records.length === 0 ? (
            <div className="empty-state">
              <FileBarChart2 className="empty-icon" />
              <h3>No reports yet</h3>
              <p>Verify a document to generate its first report.</p>
              <Link to="/verify" className="btn btn-primary" style={{ marginTop: 16 }}>Verify a document</Link>
            </div>
          ) : (
            <ul className="report-pick-list">
              {records.map((r) => (
                <li key={r.id}>
                  <button
                    className={"report-pick-item" + (selected?.id === r.id ? " active" : "")}
                    onClick={() => setSelected(r)}
                  >
                    <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.fileName || "Untitled document"}
                    </span>
                    <span className="text-faint text-sm">{formatDate(r.uploadedAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card card-pad reports-detail">
          {selected ? (
            <>
              <div className="page-head-row" style={{ marginBottom: 18 }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem" }}>{selected.fileName || "Untitled document"}</h3>
                  <p className="text-faint text-sm mono">{selected.id}</p>
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => handleDownload(selected.id)}>
                  <Download size={15} /> Download report
                </button>
              </div>

              <dl className="meta-grid">
                <div className="meta-grid-row">
                  <dt className="text-soft text-sm">Verification status</dt>
                  <dd><span className={`badge ${statusMeta(selected.status).badgeClass}`}>{statusMeta(selected.status).label}</span></dd>
                </div>
                <div className="meta-grid-row">
                  <dt className="text-soft text-sm">AI confidence</dt>
                  <dd className="mono">{selected.confidence != null ? `${selected.confidence}%` : "Not available"}</dd>
                </div>
                <div className="meta-grid-row">
                  <dt className="text-soft text-sm">Document type</dt>
                  <dd>{selected.documentType || "Not available"}</dd>
                </div>
              </dl>

              <div className="stack-16" style={{ marginTop: 20 }}>
                <div>
                  <p style={{ fontWeight: 600, marginBottom: 6 }}>OCR result</p>
                  <p className="text-soft text-sm">{selected.extractedText ? "Extracted text available — open the full result to view it." : "Not available"}</p>
                </div>
                <div>
                  <p style={{ fontWeight: 600, marginBottom: 6 }}>Fraud indicators</p>
                  <p className="text-soft text-sm">
                    {selected.indicators?.length ? `${selected.indicators.length} indicator(s) recorded.` : "None recorded."}
                  </p>
                </div>
                <div>
                  <p style={{ fontWeight: 600, marginBottom: 6 }}>Metadata analysis</p>
                  <p className="text-soft text-sm">{selected.metadata ? "Metadata captured — open the full result to view it." : "Not available"}</p>
                </div>
              </div>

              <Link to={`/result/${selected.id}`} state={{ result: selected }} className="btn btn-primary" style={{ marginTop: 20 }}>
                Open full result
              </Link>
            </>
          ) : (
            <p className="text-soft text-sm">Select a report from the list.</p>
          )}
        </div>
      </div>
    </div>
  );
}
