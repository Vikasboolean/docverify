export default function MetadataCard({ metadata }) {
  const rows = [
    { label: "Creation date", value: metadata?.creation_date || metadata?.createdAt },
    { label: "Modification date", value: metadata?.modification_date || metadata?.modifiedAt },
    { label: "Software", value: metadata?.software },
    { label: "Author", value: metadata?.author },
    {
      label: "Metadata consistency",
      value:
        metadata?.consistent === true
          ? "Consistent"
          : metadata?.consistent === false
          ? "Inconsistent"
          : metadata?.consistency,
    },
  ];

  return (
    <div className="card card-pad">
      <h3 style={{ fontSize: "1.05rem", marginBottom: 4 }}>Metadata analysis</h3>
      <p className="text-soft text-sm" style={{ marginBottom: 16 }}>
        Embedded file metadata, where the source document exposed any.
      </p>
      <dl className="meta-grid">
        {rows.map((r) => (
          <div key={r.label} className="meta-grid-row">
            <dt className="text-soft text-sm">{r.label}</dt>
            <dd className={r.value ? "" : "text-faint"}>{r.value || "Not available"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
