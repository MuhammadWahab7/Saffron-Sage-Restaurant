import { useEffect, useMemo, useState } from "react";
import { getUserDisplayName, useAuth } from "../context/AuthContext";
import {
  createReservation,
  getSlotAvailability,
  SLOT_CAPACITY,
} from "../services/reservations";
import { submitNetlifyForm } from "../utils/forms";

const createInitialForm = (user, preferredDish = "") => ({
  name: getUserDisplayName(user),
  email: user?.email || "",
  phone: "",
  date: "",
  time: "19:00",
  guests: "2",
  occasion: "Casual dining",
  preferredDish,
  seatingPreference: "Best available",
  specialRequests: "",
  "bot-field": "",
  submissionType: "restaurant-booking",
});

export default function BookingModal({
  open,
  onClose,
  preferredDish = "",
  onReservationCreated,
}) {
  const { user, authMode } = useAuth();
  const [form, setForm] = useState(() => createInitialForm(user, preferredDish));
  const [status, setStatus] = useState("idle");
  const [mode, setMode] = useState("");
  const [error, setError] = useState("");
  const [emailWarning, setEmailWarning] = useState("");
  const [reservation, setReservation] = useState(null);
  const [availability, setAvailability] = useState({
    status: "idle",
    capacity: SLOT_CAPACITY,
    booked: 0,
    remaining: SLOT_CAPACITY,
  });

  useEffect(() => {
    if (!open) return undefined;

    setForm(createInitialForm(user, preferredDish));
    setStatus("idle");
    setError("");
    setEmailWarning("");
    setReservation(null);
    setAvailability({
      status: "idle",
      capacity: SLOT_CAPACITY,
      booked: 0,
      remaining: SLOT_CAPACITY,
    });
    document.body.classList.add("modal-open");

    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, onClose, preferredDish, user]);

  useEffect(() => {
    if (!open || !form.date || !form.time) return undefined;

    let active = true;
    const timer = window.setTimeout(async () => {
      setAvailability((current) => ({ ...current, status: "loading" }));
      try {
        const result = await getSlotAvailability({ date: form.date, time: form.time });
        if (active) setAvailability({ status: "ready", ...result });
      } catch (availabilityError) {
        if (active) {
          setAvailability((current) => ({
            ...current,
            status: "error",
            error: availabilityError.message,
          }));
        }
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [open, form.date, form.time]);

  const requestedGuests = Number(form.guests);
  const insufficientSeats =
    availability.status === "ready" && requestedGuests > availability.remaining;

  const occupancy = useMemo(() => {
    if (!availability.capacity) return 0;
    return Math.min((availability.booked / availability.capacity) * 100, 100);
  }, [availability]);

  if (!open || !user) return null;

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submitForm = async (event) => {
    event.preventDefault();
    setStatus("sending");
    setError("");
    setEmailWarning("");

    try {
      const latestAvailability = await getSlotAvailability({
        date: form.date,
        time: form.time,
      });
      if (requestedGuests > latestAvailability.remaining) {
        throw new Error(
          latestAvailability.remaining === 0
            ? "This dining time is now fully booked. Please choose another time."
            : `Only ${latestAvailability.remaining} seats remain at this time.`,
        );
      }

      const created = await createReservation({ user, values: form });
      setReservation(created);

      try {
        const result = await submitNetlifyForm("restaurant-booking", {
          ...form,
          userId: user.id,
          bookingId: created.id,
          bookingStatus: created.status,
          authMode,
        });
        setMode(result.mode);
      } catch (mailError) {
        setEmailWarning(
          "Your seat is reserved, but the notification email could not be sent. The booking remains in My Reservations.",
        );
      }

      setStatus("success");
      onReservationCreated?.(created);
    } catch (submitError) {
      const message = submitError.message || "The reservation could not be completed.";
      setError(
        message.includes("Not enough seats")
          ? "That time has just filled up. Choose another dining time."
          : message,
      );
      setStatus("error");
    }
  };

  const closeModal = () => {
    setStatus("idle");
    onClose();
  };

  return (
    <div className="modal-scroll-shell booking-backdrop" onMouseDown={closeModal}>
      <section
        className="booking-modal booking-modal--scrollable"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-round-close" onClick={closeModal} aria-label="Close booking form">×</button>

        {status !== "success" ? (
          <>
            <div className="booking-account-strip">
              <div className="booking-account-strip__avatar">{getUserDisplayName(user).charAt(0).toUpperCase()}</div>
              <div>
                <span>Booking as</span>
                <strong>{getUserDisplayName(user)}</strong>
                <small>{user.email}</small>
              </div>
              <b>Signed in</b>
            </div>

            <span className="eyebrow">Reservations</span>
            <h2 id="booking-title">Reserve your table</h2>
            <p>
              Choose your date, time and number of guests. We check availability again when you confirm the booking.
            </p>

            {preferredDish && (
              <div className="booking-dish-banner">
                <span>Selected from menu</span>
                <strong>{preferredDish}</strong>
              </div>
            )}

            <form name="restaurant-booking" method="POST" data-netlify="true" netlify-honeypot="bot-field" onSubmit={submitForm}>
              <input type="hidden" name="form-name" value="restaurant-booking" />
              <input type="hidden" name="submissionType" value="restaurant-booking" />
              <input type="hidden" name="userId" value={user.id} />
              <p className="hidden-field"><label>Do not fill this out: <input name="bot-field" value={form["bot-field"]} onChange={updateField} /></label></p>

              <div className="form-row">
                <label>
                  Guest name
                  <input name="name" value={form.name} onChange={updateField} placeholder="Full name" required />
                </label>
                <label>
                  Account email
                  <input type="email" name="email" value={form.email} readOnly aria-readonly="true" />
                </label>
              </div>

              <label>Phone number<input type="tel" name="phone" value={form.phone} onChange={updateField} placeholder="Contact number" required /></label>

              <div className="form-row">
                <label>Date<input type="date" name="date" value={form.date} onChange={updateField} min={new Date().toISOString().split("T")[0]} required /></label>
                <label>Time
                  <select name="time" value={form.time} onChange={updateField}>
                    <option value="12:00">12:00, Lunch</option>
                    <option value="13:30">13:30, Lunch</option>
                    <option value="18:00">18:00, Early dinner</option>
                    <option value="19:00">19:00, Dinner</option>
                    <option value="20:30">20:30, Late dinner</option>
                  </select>
                </label>
              </div>

              {form.date && (
                <div className={`seat-availability seat-availability--${availability.status}`} aria-live="polite">
                  <div className="seat-availability__top">
                    <div>
                      <span>Live seat availability</span>
                      <strong>
                        {availability.status === "loading"
                          ? "Checking the dining room..."
                          : availability.status === "error"
                            ? "Availability unavailable"
                            : `${availability.remaining} of ${availability.capacity} seats remain`}
                      </strong>
                    </div>
                    <b>{availability.status === "ready" ? `${Math.round(100 - occupancy)}% free` : "•••"}</b>
                  </div>
                  <div className="seat-meter"><i style={{ width: `${occupancy}%` }} /></div>
                  {insufficientSeats && <p>Choose fewer guests or another dining time.</p>}
                </div>
              )}

              <div className="form-row">
                <label>Number of guests
                  <select name="guests" value={form.guests} onChange={updateField}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((number) => <option key={number} value={number}>{number} {number === 1 ? "guest" : "guests"}</option>)}
                  </select>
                </label>
                <label>Seating preference
                  <select name="seatingPreference" value={form.seatingPreference} onChange={updateField}>
                    <option>Best available</option>
                    <option>Garden view</option>
                    <option>Window table</option>
                    <option>Quiet corner</option>
                    <option>Near the fireplace</option>
                    <option>Accessible seating</option>
                  </select>
                </label>
              </div>

              <label>Occasion
                <select name="occasion" value={form.occasion} onChange={updateField}>
                  <option>Casual dining</option><option>Birthday</option><option>Anniversary</option><option>Business meal</option><option>Other celebration</option>
                </select>
              </label>

              <label>Preferred dish<input name="preferredDish" value={form.preferredDish} onChange={updateField} placeholder="Optional menu favourite" /></label>
              <label>Special requests<textarea name="specialRequests" value={form.specialRequests} onChange={updateField} placeholder="Allergies, accessibility, celebration notes..." /></label>

              {status === "error" && <p className="form-error" role="alert">{error}</p>}

              <button className="button button--full" type="submit" disabled={status === "sending" || insufficientSeats || availability.status === "loading"}>
                {status === "sending" ? "Saving your booking..." : "Confirm reservation"} <span>↗</span>
              </button>
              <small className="booking-security-note">This booking will be saved to {user.email}.</small>
            </form>
          </>
        ) : (
          <div className="booking-success" aria-live="polite">
            <span className="booking-success__icon">✓</span>
            <span className="eyebrow">Booking confirmed</span>
            <h2>See you soon, {form.name}.</h2>
            <p>
              {form.guests} {Number(form.guests) === 1 ? "seat is" : "seats are"} reserved on {form.date} at {form.time} under <strong>{user.email}</strong>.
            </p>
            <div className="booking-confirmation-card">
              <div><span>Reference</span><strong>{String(reservation?.id || "").slice(0, 8).toUpperCase()}</strong></div>
              <div><span>Seating</span><strong>{form.seatingPreference}</strong></div>
              <div><span>Status</span><strong>Confirmed</strong></div>
            </div>
            {mode === "preview" && <p className="preview-note">This is a local preview. Email notifications will work after the website is published.</p>}
            {emailWarning && <p className="form-error">{emailWarning}</p>}
            <button className="button button--full" onClick={closeModal}>Done</button>
          </div>
        )}
      </section>
    </div>
  );
}
