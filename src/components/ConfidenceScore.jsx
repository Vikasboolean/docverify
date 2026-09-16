function barColor(value) {
  if (value >= 80) return "var(--color-valid)";
  if (value >= 50) return "var(--color-suspicious)";
  return "var(--color-invalid)";
}

export default function ConfidenceScore({ overall, breakdown }) {
  const entries = Object.entries(breakdown || {});

  return (
    <div className="card card-pad">
      <h3 style={{ fontSize: "1.05rem", marginBottom: 4 }}>AI confidence</h3>
      <p className="text-soft text-sm" style={{ marginBottom: 20 }}>
        Composite score from every check the pipeline ran on this document.
      </p>

      <div className="row-12" style={{ marginBottom: 22 }}>
        <span className="mono" style={{ fontSize: "2.1rem", fontWeight: 600 }}>
          {overall != null ? `${overall}%` : "—"}
        </span>
        <div style={{ flex: 1 }}>
          <div className="confidence-track">
            <div className="confidence-fill" style={{ width: `${overall || 0}%`, background: barColor(overall || 0) }} />
          </div>
        </div>
      </div>

      {entries.length > 0 ? (
        <div className="stack-16">
          {entries.map(([label, value]) => (
            <div key={label}>
              <div className="row-8" style={{ justifyContent: "space-between", marginBottom: 6 }}>
                <span className="text-sm" style={{ fontWeight: 600 }}>{label}</span>
                <span className="mono text-sm text-soft">{value}%</span>
              </div>
              <div className="confidence-track confidence-track-sm">
                <div className="confidence-fill" style={{ width: `${value}%`, background: barColor(value) }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-soft text-sm">Detailed breakdown unavailable — the backend returned a single overall score.</p>
      )}
    </div>
  );
}
