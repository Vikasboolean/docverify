import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { isValidEmail } from "../utils/helpers";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { signUp } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Enter your name.";
    if (!isValidEmail(form.email)) e.email = "Enter a valid email address.";
    if (!form.password || form.password.length < 6) e.password = "Password must be at least 6 characters.";
    if (form.confirm !== form.password) e.confirm = "Passwords don't match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await signUp({ name: form.name, email: form.email, password: form.password });
      toast.success("Account created.");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Couldn't create your account.");
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
        <h1 style={{ fontSize: "1.4rem", marginBottom: 6 }}>Create an account</h1>
        <p className="text-soft text-sm" style={{ marginBottom: 20 }}>Start verifying documents in a few seconds.</p>

        <form onSubmit={handleSubmit} style={{ marginTop: 18 }} noValidate>
          <div className="field">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              value={form.name}
              className={errors.name ? "has-error" : ""}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>
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
          <div className="field">
            <label htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              type="password"
              value={form.confirm}
              className={errors.confirm ? "has-error" : ""}
              onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
            />
            {errors.confirm && <span className="field-error">{errors.confirm}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting} style={{ marginTop: 8 }}>
            {submitting ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p className="text-soft text-sm" style={{ marginTop: 18, textAlign: "center" }}>
          Already have an account? <Link to="/login" style={{ color: "var(--color-primary)", fontWeight: 600 }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
