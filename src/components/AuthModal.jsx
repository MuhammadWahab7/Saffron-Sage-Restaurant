import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

const initialValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function AuthModal({ open, onClose, onAuthenticated, purpose = "account" }) {
  const { signIn, signUp, authMode, isLiveAuth, configurationError } = useAuth();
  const [view, setView] = useState("signin");
  const [values, setValues] = useState(initialValues);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const title = useMemo(() => {
    if (view === "signup") return "Create your dining account";
    if (purpose === "booking") return "Sign in to reserve your table";
    return "Welcome back";
  }, [purpose, view]);

  useEffect(() => {
    if (!open) return undefined;
    setStatus("idle");
    setError("");
    setMessage("");
    document.body.classList.add("modal-open");

    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  const update = (event) => {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const changeView = (nextView) => {
    setView(nextView);
    setError("");
    setMessage("");
    setStatus("idle");
  };

  const submit = async (event) => {
    event.preventDefault();
    setStatus("sending");
    setError("");
    setMessage("");

    try {
      if (view === "signup") {
        if (values.password.length < 8) {
          throw new Error("Use at least 8 characters for your password.");
        }
        if (values.password !== values.confirmPassword) {
          throw new Error("The passwords do not match.");
        }

        const result = await signUp(values);
        if (result.requiresEmailConfirmation) {
          setMessage("Account created. Check your inbox and confirm your email, then sign in.");
          setStatus("success");
          return;
        }

        setStatus("success");
        onAuthenticated?.(result.user);
        return;
      }

      const result = await signIn(values);
      setStatus("success");
      onAuthenticated?.(result.user);
    } catch (submitError) {
      setError(submitError.message || "Authentication failed. Please try again.");
      setStatus("error");
    }
  };

  return (
    <div className="modal-scroll-shell auth-backdrop" onMouseDown={onClose}>
      <section
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-round-close" onClick={onClose} aria-label="Close account window">×</button>

        <div className="auth-modal__content">
          <span className="eyebrow">Guest account</span>
          <h2 id="auth-title">{title}</h2>
          <p className="auth-modal__intro">
            {view === "signup"
              ? "Create an account to keep your bookings in one place."
              : purpose === "booking"
                ? "After you sign in, the booking form will open automatically."
                : "Sign in to book a table and view your reservations."}
          </p>

          {purpose === "booking" && view === "signin" && (
            <div className="auth-purpose-banner" aria-live="polite">
              <span>Step 1 of 2</span>
              <p>Sign in first. You can choose the booking details on the next screen.</p>
            </div>
          )}

          <div className="auth-mode-note">
            <span>{authMode === "supabase" ? "Account service connected" : "Account service unavailable"}</span>
            <p>
              {authMode === "supabase"
                ? "Your account is ready to use."
                : configurationError}
            </p>
          </div>

          {!isLiveAuth ? (
            <div className="auth-message" aria-live="polite">
              <span>!</span>
              <h3>Accounts are not available yet</h3>
              <p>{configurationError}</p>
            </div>
          ) : message ? (
            <div className="auth-message" aria-live="polite">
              <span>✓</span>
              <h3>Check your email</h3>
              <p>{message}</p>
              <button className="button button--dark button--full" onClick={() => changeView("signin")}>Back to sign in</button>
            </div>
          ) : (
            <form onSubmit={submit} className="auth-form">
              {view === "signup" && (
                <label>
                  Full name
                  <input name="name" value={values.name} onChange={update} autoComplete="name" placeholder="Your full name" required />
                </label>
              )}

              <label>
                Email address
                <input type="email" name="email" value={values.email} onChange={update} autoComplete="email" placeholder="name@example.com" required />
              </label>

              <label>
                Password
                <input
                  type="password"
                  name="password"
                  value={values.password}
                  onChange={update}
                  autoComplete={view === "signup" ? "new-password" : "current-password"}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                />
              </label>

              {view === "signup" && (
                <label>
                  Confirm password
                  <input type="password" name="confirmPassword" value={values.confirmPassword} onChange={update} autoComplete="new-password" placeholder="Repeat your password" required minLength={8} />
                </label>
              )}

              {status === "error" && <p className="form-error" role="alert">{error}</p>}

              <button className="button button--dark button--full" type="submit" disabled={status === "sending"}>
                {status === "sending"
                  ? "Please wait..."
                  : view === "signup"
                    ? "Create account"
                    : purpose === "booking"
                      ? "Sign in & continue"
                      : "Sign in"}
                <span>↗</span>
              </button>
            </form>
          )}

          {isLiveAuth && !message && (
            <div className="auth-switches">
              {view === "signin" && (
                <span>New here? <button onClick={() => changeView("signup")}>Create an account</button></span>
              )}
              {view === "signup" && <span>Already have an account? <button onClick={() => changeView("signin")}>Sign in</button></span>}
            </div>
          )}
        </div>

        <div className="auth-modal__art" aria-hidden="true">
          <div className="auth-modal__art-copy">
            <span>Saffron &amp; Sage</span>
            <h3>{purpose === "booking" ? "Your table is one step away." : "Your bookings in one place."}</h3>
            <p>Sign in once to manage your current and future bookings.</p>
          </div>
          <img className="auth-modal__seal" src="/assets/saffron-sage-emblem.png" alt="Saffron and Sage emblem" />
        </div>
      </section>
    </div>
  );
}
