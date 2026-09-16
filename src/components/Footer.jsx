import { ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="row-8">
          <ShieldCheck size={18} />
          <span style={{ fontWeight: 600 }}>VeriGate</span>
        </div>
        <p className="text-soft text-sm">
          AI-assisted document analysis. Results are risk assessments, not legal proof of authenticity.
        </p>
        <p className="text-faint text-sm">© {new Date().getFullYear()} VeriGate. Built for demonstration.</p>
      </div>
    </footer>
  );
}
