import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, History as HistoryIcon, ArrowUpDown } from "lucide-react";
import { getVerificationHistory } from "../services/api";
import { formatDate, statusMeta } from "../utils/helpers";

const STATUS_FILTERS = ["ALL", "VALID", "SUSPICIOUS", "INVALID", "UNKNOWN"];

export default function History() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    (async () => {
      const { data } = await getVerificationHistory();
      setRecords(data);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let rows = records.filter((r) =>
      (r.fileName || "").toLowerCase().includes(query.toLowerCase()) ||
      (r.documentType || "").toLowerCase().includes(query.toLowerCase())
    );
    if (statusFilter !== "ALL") rows = rows.filter((r) => r.status === statusFilter);
    rows.sort((a, b) => {
      const diff = new Date(a.uploadedAt) - new Date(b.uploadedAt);
      return sortDir === "asc" ? diff : -diff;
    });
    return rows;
  }, [records, query, statusFilter, sortDir]);

  return (
    <div className="app-main-inner">
      <div className="page-head">
        <h1>Verification history</h1>
        <p>Every document analyzed on this device, most recent first.</p>
      </div>

      <div className="card card-pad" style={{ marginTop: 18 }}>
        <div className="history-toolbar">
          <div className="search-input">
            <Search size={16} />
            <input
              placeholder="Search by file name or document type"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search verification history"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>{s === "ALL" ? "All statuses" : statusMeta(s).label}</option>
            ))}
          </select>
          <button className="btn btn-outline btn-sm" onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}>
            <ArrowUpDown size={14} /> {sortDir === "asc" ? "Oldest first" : "Newest first"}
          </button>
        </div>

        {loading ? (
          <div className="stack-12" style={{ marginTop: 20 }}>
            {[1, 2, 3].map((i) => <div key={i} className="skel" style={{ height: 52 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <HistoryIcon className="empty-icon" />
            <h3>No verifications yet</h3>
            <p>Documents you analyze will show up here.</p>
            <Link to="/verify" className="btn btn-primary" style={{ marginTop: 16 }}>Verify a document</Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Confidence</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const meta = statusMeta(r.status);
                  return (
                    <tr key={r.id}>
                      <td data-label="Document">
                        <span style={{ fontWeight: 600 }}>{r.fileName || "Untitled document"}</span>
                        <div className="text-faint text-sm">{r.documentType}</div>
                      </td>
                      <td data-label="Date">{formatDate(r.uploadedAt)}</td>
                      <td data-label="Status">
                        <span className={`badge ${meta.badgeClass}`}>{meta.label}</span>
                      </td>
                      <td data-label="Confidence" className="mono">{r.confidence != null ? `${r.confidence}%` : "—"}</td>
                      <td data-label="Action">
                        <Link to={`/result/${r.id}`} state={{ result: r }} className="btn btn-ghost btn-sm">View result</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
