import { FlaskConical } from "lucide-react";

export default function MockBanner({ children }) {
  return (
    <div className="mock-banner">
      <FlaskConical size={16} style={{ flexShrink: 0 }} />
      <span>{children || "This view is running on locally-stored demo data because the backend doesn't expose this endpoint yet."}</span>
    </div>
  );
}
