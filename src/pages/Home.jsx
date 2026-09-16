import { Link } from "react-router-dom";
import {
  ScanSearch,
  Camera,
  UploadCloud,
  Cpu,
  Fingerprint,
  FileCheck2,
  Info,
} from "lucide-react";

const DOCUMENT_TYPES = [
  "Aadhaar Card",
  "PAN Card",
  "Driving Licence",
  "Passport",
  "10th Marksheet",
  "12th Marksheet",
];

const STEPS = [
  { icon: UploadCloud, title: "Upload document", desc: "Drop in a JPG, PNG, or PDF scan of the document you want checked." },
  { icon: Cpu, title: "AI analyzes document", desc: "OCR, structural, and algorithmic checks run against the file." },
  { icon: Fingerprint, title: "Forgery & integrity checks", desc: "Visual, metadata, and cross-registry signals are combined." },
  { icon: FileCheck2, title: "Verification result", desc: "A status, confidence score, and full breakdown are returned." },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <h1>Verify documents with AI</h1>
            <p className="hero-sub">
              Upload a document and let our AI analyze its authenticity, structure, metadata, and visual
              characteristics.
            </p>
            <div className="row-12" style={{ flexWrap: "wrap" }}>
              <Link to="/verify" className="btn btn-primary">
                <ScanSearch size={18} /> Verify a document
              </Link>
              <Link to="/dashboard" className="btn btn-outline">View dashboard</Link>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="hero-visual-card">
              <div className="hero-visual-row">
                <div className="hero-visual-dot" />
                <div className="hero-visual-line" style={{ width: "70%" }} />
              </div>
              <div className="hero-visual-scan-doc">
                <div className="hero-visual-doc-line" style={{ width: "85%" }} />
                <div className="hero-visual-doc-line" style={{ width: "62%" }} />
                <div className="hero-visual-doc-line" style={{ width: "74%" }} />
                <div className="hero-visual-doc-line" style={{ width: "40%" }} />
                <div className="hero-visual-scanbar" />
              </div>
              <div className="row-8" style={{ marginTop: 16 }}>
                <span className="badge badge-valid">Checksum passed</span>
                <span className="badge badge-unknown">OCR 98% match</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <h2>Types of Documents</h2>
          <p className="text-soft">Upload any of these documents for verification.</p>
        </div>
        <div className="feature-grid">
          {DOCUMENT_TYPES.map((documentType) => (
            <div key={documentType} className="feature-card">
              <div className="feature-icon"><FileCheck2 size={20} /></div>
              <h3>{documentType}</h3>
              <div className="row-8" style={{ flexWrap: "wrap", marginTop: 14 }}>
                <Link to="/verify" className="btn btn-primary btn-sm">
                  <UploadCloud size={15} /> Upload Document
                </Link>
                <Link to="/verify" className="btn btn-outline btn-sm">
                  <Camera size={15} /> Web Camera
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <h2>How it works</h2>
          <p className="text-soft">From upload to verdict in four steps.</p>
        </div>
        <div className="steps-grid">
          {STEPS.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="step-card">
              <div className="step-card-top">
                <div className="feature-icon"><Icon size={18} /></div>
                <span className="mono step-card-index">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3>{title}</h3>
              <p className="text-soft text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="security-note">
          <Info size={20} style={{ flexShrink: 0, marginTop: 2 }} />
          <p>
            VeriGate produces an AI-assisted risk assessment, not a legal determination. Results should support,
            not replace, a qualified reviewer's judgment — treat any output as a starting point for further
            verification, not proof of a document's authenticity.
          </p>
        </div>
      </section>
    </>
  );
}
