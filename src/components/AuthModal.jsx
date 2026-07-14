import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import ActionArrow from "./ActionArrow";

const initialValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function AuthModal({ open, onClose, onAuthenticated, purpose = "account" }) {
  const {
    signIn,
    signUp,
    resetPassword,
    completePasswordRecovery,
    dismissPasswordRecovery,
    passwordRecovery,
    authMode,
    isLiveAuth,
    configurationError,
  } = useAuth();
  const [view, setView] = useState("signin");
  const [values, setValues] = useState(initialValues);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const title = useMemo(() => {
    if (view === "recovery") return "Choose a new password";
    if (view === "forgot") return "Reset your password";
    if (view === "signup") return "Create your dining account";
    if (purpose === "booking") return "Sign in to reserve your table";
    return "Welcome back";
  }, [purpose, view]);

  const closeModal = () => {
    if (passwordRecovery) dismissPasswordRecovery();
    onClose();
  };

  useEffect(() => {
    if (!open) return undefined;
    setView(passwordRecovery ? "recovery" : "signin");
    setValues(initialValues);
    setStatus("idle");
    setError("");
    setMessage("");
    document.body.classList.add("modal-open");

    const closeOnEscape = (event) => {
      if (event.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, passwordRecovery]);

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
      if (view === "forgot") {
        await resetPassword(values.email);
        setMessage("We sent a secure password-reset link to your email address.");
        setStatus("success");
        return;
      }

      if (view === "recovery") {
        if (values.password !== values.confirmPassword) {
          throw new Error("The passwords do not match.");
        }
        await completePasswordRecovery(values.password);
        setMessage("Your password has been updated. Your account is ready to use.");
        setStatus("success");
        return;
      }

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
    <div className="modal-scroll-shell auth-backdrop" onMouseDown={closeModal}>
      <section
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-round-close" onClick={closeModal} aria-label="Close account window">×</button>

        <div className="auth-modal__content">
          <span className="eyebrow">Guest account</span>
          <h2 id="auth-title">{title}</h2>
          <p className="auth-modal__intro">
            {view === "recovery"
              ? "Enter and confirm a secure new password for your dining account."
              : view === "forgot"
                ? "Enter your account email and we will send you a secure reset link."
                : view === "signup"
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
              <h3>{view === "recovery" ? "Password updated" : "Check your email"}</h3>
              <p>{message}</p>
              <button
                className="button button--dark button--full"
                onClick={view === "recovery" ? closeModal : () => changeView("signin")}
              >
                {view === "recovery" ? "Continue to my account" : "Back to sign in"}
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="auth-form">
              {view === "signup" && (
                <label>
                  Full name
                  <input name="name" value={values.name} onChange={update} autoComplete="name" placeholder="Your full name" required />
                </label>
              )}

              {view !== "recovery" && (
                <label>
                  Email address
                  <input type="email" name="email" value={values.email} onChange={update} autoComplete="email" placeholder="name@example.com" required />
                </label>
              )}

              {view !== "forgot" && (
                <label>
                  {view === "recovery" ? "New password" : "Password"}
                  <input
                    type="password"
                    name="password"
                    value={values.password}
                    onChange={update}
                    autoComplete={view === "signin" ? "current-password" : "new-password"}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                  />
                </label>
              )}

              {(view === "signup" || view === "recovery") && (
                <label>
                  Confirm password
                  <input type="password" name="confirmPassword" value={values.confirmPassword} onChange={update} autoComplete="new-password" placeholder="Repeat your password" required minLength={8} />
                </label>
              )}

              {status === "error" && <p className="form-error" role="alert">{error}</p>}

              <button className="button button--dark button--full" type="submit" disabled={status === "sending"}>
                {status === "sending"
                  ? "Please wait..."
                  : view === "forgot"
                    ? "Send reset link"
                    : view === "recovery"
                      ? "Update password"
                      : view === "signup"
                    ? "Create account"
                    : purpose === "booking"
                      ? "Sign in & continue"
                      : "Sign in"}
                <ActionArrow />
              </button>
            </form>
          )}

          {isLiveAuth && !message && (
            <div className="auth-switches">
              {view === "signin" && (
                <>
                  <span>New here? <button onClick={() => changeView("signup")}>Create an account</button></span>
                  <span>Forgot your password? <button onClick={() => changeView("forgot")}>Reset it securely</button></span>
                </>
              )}
              {view === "signup" && <span>Already have an account? <button onClick={() => changeView("signin")}>Sign in</button></span>}
              {view === "forgot" && <span>Remembered your password? <button onClick={() => changeView("signin")}>Sign in</button></span>}
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
