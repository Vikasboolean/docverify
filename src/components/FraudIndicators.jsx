import { CheckCircle2, AlertTriangle, AlertOctagon } from "lucide-react";

const SEVERITY = {
  high: { icon: AlertOctagon, className: "indicator-high" },
  medium: { icon: AlertTriangle, className: "indicator-medium" },
  info: { icon: CheckCircle2, className: "indicator-info" },
};

export default function FraudIndicators({ indicators }) {
  return (
    <div className="card card-pad">
      <h3 style={{ fontSize: "1.05rem", marginBottom: 4 }}>Fraud indicators</h3>
      <p className="text-soft text-sm" style={{ marginBottom: 18 }}>
        Signals the pipeline flagged (or explicitly cleared) during analysis.
      </p>

      {indicators && indicators.length > 0 ? (
        <ul className="indicator-list">
          {indicators.map((ind, i) => {
            const sev = SEVERITY[ind.passed ? "info" : ind.severity] || SEVERITY.medium;
            const Icon = sev.icon;
            return (
              <li key={i} className={`indicator-item ${sev.className}`}>
                <Icon size={17} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div className="row-8" style={{ justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 600 }}>{ind.label}</span>
                    {ind.confidence != null && (
                      <span className="mono text-sm text-soft">{Math.round(ind.confidence <= 1 ? ind.confidence * 100 : ind.confidence)}%</span>
                    )}
                  </div>
                  {ind.description && <p className="text-soft text-sm" style={{ marginTop: 2 }}>{ind.description}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-soft text-sm">No fraud indicators were reported by the backend for this document.</p>
      )}
    </div>
  );
}
