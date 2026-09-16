import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

const STEPS = [
  "Document uploaded",
  "Extracting text",
  "Running OCR",
  "Checking document structure",
  "Analyzing visual elements",
  "Checking suspicious modifications",
  "Generating AI confidence score",
];

/**
 * Purely presentational step-through. The actual API call runs in parallel
 * (see VerifyDocument.jsx) — this just paces through the step labels so the
 * person understands what's happening while they wait for a real response.
 */
export default function VerificationProgress({ done = false }) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (done) {
      setActiveStep(STEPS.length);
      return;
    }
    if (activeStep >= STEPS.length - 1) return;
    const t = setTimeout(() => setActiveStep((s) => s + 1), 900);
    return () => clearTimeout(t);
  }, [activeStep, done]);

  const percent = Math.round((Math.min(activeStep, STEPS.length) / STEPS.length) * 100);

  return (
    <div className="verify-progress">
      <div className="verify-progress-bar-track">
        <div className="verify-progress-bar-fill" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-soft text-sm" style={{ marginBottom: 20 }}>
        {done ? "Analysis complete." : `Analyzing document… ${percent}%`}
      </p>

      <ul className="verify-progress-steps">
        {STEPS.map((label, i) => {
          const complete = i < activeStep || done;
          const active = i === activeStep && !done;
          return (
            <li key={label} className={complete ? "complete" : active ? "active" : ""}>
              <span className="verify-progress-icon">
                {complete ? <Check size={14} /> : active ? <Loader2 size={14} className="spin" /> : null}
              </span>
              {label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
