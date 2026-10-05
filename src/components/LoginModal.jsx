import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "../lib/supabase.js";
import { loginUser, useAuth } from "../lib/auth.jsx";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export default function LoginModal() {
  const { user, center, membership, centerLoading, centerError, refreshCenter } = useAuth();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  // Lock page scroll while the gate is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Close on Escape is disabled — login is required. (Kept for a11y focus only.)

  const set = (k) => (e) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
    setFormError("");
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = {};
    if (!values.email.trim()) e.email = "Email is required.";
    else if (!EMAIL_RE.test(values.email.trim())) e.email = "Enter a valid email address.";
    if (!values.password) e.password = "Password is required.";
    if (Object.keys(e).length) return setErrors(e);

    setSubmitting(true);
    setFormError("");
    const r = await loginUser({ email: values.email.trim(), password: values.password });
    if (r.error) {
      setSubmitting(false);
      return setFormError(r.error);
    }
    setJustLoggedIn(true);
    const c = await refreshCenter();
    setSubmitting(false);
    if (c.error) setFormError(c.error);
  };

  const needsCenter = user && !centerLoading && !membership && justLoggedIn;

  return (
    <div className="login-overlay" role="dialog" aria-modal="true" aria-labelledby="login-title">
      <div className="login-card">
        <div className="login-brand">
          <span className="header-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10 12 5 2 10l10 5 10-5z" />
              <path d="M6 12v5c3 2 9 2 12 0v-5" />
            </svg>
          </span>
          <div>
            <b>Attendance Dashboard</b>
            <small>{center ? center.name : "Center sign in"}</small>
          </div>
        </div>

        <h2 id="login-title">Welcome back</h2>
        <p className="muted">
          Sign in with your center account (the same email + password you registered in the Center Portal).
        </p>

        {!isSupabaseConfigured && (
          <p className="notice notice--error" role="alert">
            Supabase is not configured. Add <code>VITE_SUPABASE_URL</code> and key to <code>.env</code>.
          </p>
        )}

        {needsCenter || (user && !centerLoading && !membership) ? (
          <div className="notice notice--error" role="alert">
            <b>No center linked to this login.</b>
            <br />
            Please register your center in the Center Portal first, then sign in here with the same
            account.
            {centerError && <span> ({centerError})</span>}
          </div>
        ) : (
          <form noValidate onSubmit={submit} className="login-form">
            <label className="login-field" htmlFor="login-email">
              <span>EMAIL</span>
              <input
                id="login-email"
                className="control"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={values.email}
                onChange={set("email")}
              />
              {errors.email && <em className="field-error">{errors.email}</em>}
            </label>
            <label className="login-field" htmlFor="login-pass">
              <span>PASSWORD</span>
              <input
                id="login-pass"
                className="control"
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
                value={values.password}
                onChange={set("password")}
              />
              {errors.password && <em className="field-error">{errors.password}</em>}
            </label>
            {(formError || centerError) && (
              <p className="form-error" role="alert">{formError || centerError}</p>
            )}
            <button type="submit" className="btn-primary" disabled={submitting || centerLoading}>
              {submitting || centerLoading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        )}

        <p className="login-hint">
          New here? Register your center in the <b>Center Portal</b>, then return here to mark
          attendance.
        </p>
      </div>
    </div>
  );
}
