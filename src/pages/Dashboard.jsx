import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileStack, ShieldCheck, ShieldAlert, ShieldX, BarChart3 } from "lucide-react";
import { getDashboardStats } from "../services/api";
import { formatDate, statusMeta } from "../utils/helpers";

const CARDS = [
  { key: "total", label: "Total documents verified", icon: FileStack, tone: "unknown" },
  { key: "valid", label: "Valid documents", icon: ShieldCheck, tone: "valid" },
  { key: "suspicious", label: "Suspicious documents", icon: ShieldAlert, tone: "suspicious" },
  { key: "invalid", label: "Invalid documents", icon: ShieldX, tone: "invalid" },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await getDashboardStats();
      setStats(data);
      setLoading(false);
    })();
  }, []);

  const hasData = stats && stats.total > 0;

  return (
    <div className="app-main-inner">
      <div className="page-head">
        <h1>Dashboard</h1>
        <p>An overview of verification activity on this device.</p>
      </div>

      <div className="stat-grid" style={{ marginTop: 18 }}>
        {CARDS.map(({ key, label, icon: Icon, tone }) => (
          <div key={key} className="card card-pad stat-card">
            <div className={`stat-icon stat-icon-${tone}`}><Icon size={20} /></div>
            <div>
              <p className="stat-value">{loading ? "—" : stats[key]}</p>
              <p className="text-soft text-sm">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="card card-pad">
          <h3 style={{ fontSize: "1.05rem", marginBottom: 16 }}>Status distribution</h3>
          {!loading && hasData ? (
            <div className="stack-16">
              {["valid", "suspicious", "invalid", "unknown"].map((k) => {
                const pct = stats.total ? Math.round((stats[k] / stats.total) * 100) : 0;
                const meta = statusMeta(k.toUpperCase());
                return (
                  <div key={k}>
                    <div className="row-8" style={{ justifyContent: "space-between", marginBottom: 6 }}>
                      <span className={`badge ${meta.badgeClass}`}>{meta.label}</span>
                      <span className="mono text-sm text-soft">{stats[k]} · {pct}%</span>
                    </div>
                    <div className="confidence-track confidence-track-sm">
                      <div
                        className="confidence-fill"
                        style={{
                          width: `${pct}%`,
                          background:
                            k === "valid" ? "var(--color-valid)" : k === "suspicious" ? "var(--color-suspicious)" : k === "invalid" ? "var(--color-invalid)" : "var(--color-unknown)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <BarChart3 className="empty-icon" />
              <h3>No verification data yet</h3>
              <p>Run a verification to populate this chart.</p>
              <Link to="/verify" className="btn btn-primary" style={{ marginTop: 16 }}>Verify a document</Link>
            </div>
          )}
        </div>

        <div className="card card-pad">
          <h3 style={{ fontSize: "1.05rem", marginBottom: 16 }}>Recent activity</h3>
          {!loading && hasData ? (
            <ul className="activity-list">
              {stats.recent.map((r) => {
                const meta = statusMeta(r.status);
                return (
                  <li key={r.id}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.fileName || "Untitled document"}
                      </p>
                      <p className="text-faint text-sm">{formatDate(r.uploadedAt)}</p>
                    </div>
                    <span className={`badge ${meta.badgeClass}`}>{meta.label}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-soft text-sm">Nothing to show yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
