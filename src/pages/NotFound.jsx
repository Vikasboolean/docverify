import { Link } from "react-router-dom";
import { ShieldQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="empty-state" style={{ minHeight: "70vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <ShieldQuestion className="empty-icon" />
      <h3>Page not found</h3>
      <p>The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn btn-primary" style={{ margin: "16px auto 0" }}>Back to home</Link>
    </div>
  );
}
