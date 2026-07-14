import { useState } from "react";
import SectionHeading from "./SectionHeading";
import ActionArrow from "./ActionArrow";
import { submitNetlifyForm } from "../utils/forms";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  topic: "General enquiry",
  message: "",
  "bot-field": "",
  submissionType: "contact",
};

export default function ContactForm() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("idle");
  const [mode, setMode] = useState("");
  const [error, setError] = useState("");

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setStatus("sending");
    setError("");

    try {
      const result = await submitNetlifyForm("contact", form);
      setMode(result.mode);
      setStatus("success");
      setForm(initialForm);
    } catch (submitError) {
      setError(submitError.message);
      setStatus("error");
    }
  };

  return (
    <section className="section contact-section" id="contact">
      <div className="container contact-shell">
        <div className="contact-copy">
          <SectionHeading
            eyebrow="Let’s talk"
            title="How can we help?"
            text="Send us a message about bookings, celebrations, dietary needs or anything else you would like to ask before visiting."
          />

          <div className="contact-promises">
            <div><span>01</span><p>Tell us what you need and how we can contact you.</p></div>
            <div><span>02</span><p>Our team will reply as soon as possible.</p></div>
            <div><span>03</span><p>Your details are only used to respond to your message.</p></div>
          </div>
        </div>

        <div className="contact-form-card">
          {status === "success" ? (
            <div className="contact-success" aria-live="polite">
              <span>✓</span>
              <h3>Thanks, your message has been sent.</h3>
              <p>
                {mode === "preview"
                  ? "This is a local preview. The message will be sent after the website is published."
                  : "Your message has been sent to the restaurant team. We will get back to you as soon as we can."}
              </p>
              <button className="button button--dark" onClick={() => setStatus("idle")}>Send another</button>
            </div>
          ) : (
            <form
              name="contact"
              method="POST"
              data-netlify="true"
              netlify-honeypot="bot-field"
              onSubmit={submit}
            >
              <input type="hidden" name="form-name" value="contact" />
              <input type="hidden" name="submissionType" value="contact" />
              <p className="hidden-field">
                <label>Do not fill this out: <input name="bot-field" value={form["bot-field"]} onChange={updateField} /></label>
              </p>

              <div className="form-row">
                <label>Your name<input name="name" value={form.name} onChange={updateField} required placeholder="Full name" /></label>
                <label>Email address<input type="email" name="email" value={form.email} onChange={updateField} required placeholder="name@example.com" /></label>
              </div>

              <div className="form-row">
                <label>Phone number<input type="tel" name="phone" value={form.phone} onChange={updateField} placeholder="Optional" /></label>
                <label>Topic
                  <select name="topic" value={form.topic} onChange={updateField}>
                    <option>General enquiry</option>
                    <option>Private dining</option>
                    <option>Celebration</option>
                    <option>Dietary requirements</option>
                    <option>Feedback</option>
                  </select>
                </label>
              </div>

              <label>Your message
                <textarea name="message" value={form.message} onChange={updateField} required minLength="10" placeholder="Tell us how we can help..." />
              </label>

              {status === "error" && <p className="form-error" role="alert">{error}</p>}

              <button className="button button--full" type="submit" disabled={status === "sending"}>
                {status === "sending" ? "Sending..." : "Send your message"} <ActionArrow />
              </button>
              <small className="form-footnote">We will only use your details to reply to this message.</small>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
