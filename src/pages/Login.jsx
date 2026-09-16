import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { isValidEmail } from "../utils/helpers";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated, signIn } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  function validate() {
    const e = {};
    if (!isValidEmail(form.email)) e.email = "Enter a valid email address.";
    if (!form.password || form.password.length < 6) e.password = "Password must be at least 6 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await signIn({ email: form.email, password: form.password });
      toast.success("Welcome back.");
      navigate(location.state?.from || "/dashboard");
    } catch (err) {
      toast.error(err.message || "Couldn't sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card card card-pad">
        <div className="row-8" style={{ marginBottom: 22 }}>
          <ShieldCheck size={22} />
          <span style={{ fontWeight: 700, fontFamily: "var(--font-display)" }}>VeriGate</span>
        </div>
        <h1 style={{ fontSize: "1.4rem", marginBottom: 6 }}>Log in</h1>
        <p className="text-soft text-sm" style={{ marginBottom: 20 }}>Access your dashboard and verification history.</p>

        <form onSubmit={handleSubmit} style={{ marginTop: 18 }} noValidate>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              className={errors.email ? "has-error" : ""}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={form.password}
              className={errors.password ? "has-error" : ""}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <div className="row-8" style={{ justifyContent: "space-between", marginBottom: 22 }}>
            <label className="field-row-inline">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Remember me
            </label>
            <Link to="#" className="text-sm" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? "Signing in…" : "Log in"}
          </button>
        </form>

        <p className="text-soft text-sm" style={{ marginTop: 18, textAlign: "center" }}>
          Don't have an account? <Link to="/register" style={{ color: "var(--color-primary)", fontWeight: 600 }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
