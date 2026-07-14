import { useCallback, useEffect, useState } from "react";
import { getUserDisplayName, useAuth } from "../context/AuthContext";
import { cancelReservation, listMyReservations } from "../services/reservations";
import ActionArrow from "./ActionArrow";

const formatDate = (value) => {
  if (!value) return "Date pending";
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
};

export default function MyReservationsModal({ open, onClose, onBook }) {
  const { user, signOut } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState("");

  const loadBookings = useCallback(async () => {
    if (!user) return;
    setStatus("loading");
    setError("");
    try {
      setBookings(await listMyReservations(user));
      setStatus("ready");
    } catch (loadError) {
      setError(loadError.message || "Bookings could not be loaded.");
      setStatus("error");
    }
  }, [user]);

  useEffect(() => {
    if (!open) return undefined;
    loadBookings();
    document.body.classList.add("modal-open");
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, onClose, loadBookings]);

  if (!open || !user) return null;

  const cancel = async (booking) => {
    const shouldCancel = window.confirm(
      `Cancel your table on ${formatDate(booking.date)} at ${booking.time}?`,
    );
    if (!shouldCancel) return;

    setCancellingId(booking.id);
    setError("");
    try {
      await cancelReservation({ user, reservationId: booking.id });
      await loadBookings();
    } catch (cancelError) {
      setError(cancelError.message || "The reservation could not be cancelled.");
    } finally {
      setCancellingId("");
    }
  };

  const logout = async () => {
    await signOut();
    onClose();
  };

  return (
    <div className="modal-scroll-shell reservations-backdrop" onMouseDown={onClose}>
      <section className="reservations-modal" role="dialog" aria-modal="true" aria-labelledby="reservations-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-round-close" onClick={onClose} aria-label="Close reservations">×</button>

        <header className="reservations-modal__header">
          <div>
            <span className="eyebrow">Guest profile</span>
            <h2 id="reservations-title">Hello, {getUserDisplayName(user)}.</h2>
            <p>{user.email}</p>
          </div>
          <div className="profile-status">
            <span>Live account</span>
            <button onClick={logout}>Sign out</button>
          </div>
        </header>

        <div className="reservations-toolbar">
          <div>
            <strong>{bookings.filter((booking) => booking.status !== "cancelled").length}</strong>
            <span>active reservations</span>
          </div>
          <button className="button button--dark" onClick={() => { onClose(); onBook(); }}>Reserve another table <ActionArrow /></button>
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}

        {status === "loading" ? (
          <div className="reservation-loading"><span />Loading your tables...</div>
        ) : bookings.length === 0 ? (
          <div className="reservations-empty">
            <span>✦</span>
            <h3>No reservations yet</h3>
            <p>Your confirmed bookings will appear here.</p>
            <button className="button button--dark" onClick={() => { onClose(); onBook(); }}>Book your first table</button>
          </div>
        ) : (
          <div className="reservation-list">
            {bookings.map((booking) => (
              <article className={`reservation-card ${booking.status === "cancelled" ? "is-cancelled" : ""}`} key={booking.id}>
                <div className="reservation-card__date">
                  <span>{new Date(`${booking.date}T12:00:00`).toLocaleDateString("en-GB", { month: "short" })}</span>
                  <strong>{new Date(`${booking.date}T12:00:00`).getDate()}</strong>
                </div>

                <div className="reservation-card__body">
                  <div className="reservation-card__title-row">
                    <div>
                      <span className={`reservation-status reservation-status--${booking.status}`}>{booking.status}</span>
                      <h3>{formatDate(booking.date)} at {booking.time}</h3>
                    </div>
                    <strong>{booking.guests} {Number(booking.guests) === 1 ? "guest" : "guests"}</strong>
                  </div>

                  <div className="reservation-card__details">
                    <span><b>Seating</b>{booking.seating_preference || "Best available"}</span>
                    <span><b>Occasion</b>{booking.occasion || "Casual dining"}</span>
                    <span><b>Dish</b>{booking.preferred_dish || "Not selected"}</span>
                    <span><b>Reference</b>{String(booking.id).slice(0, 8).toUpperCase()}</span>
                  </div>

                  {booking.special_requests && <p className="reservation-note">{booking.special_requests}</p>}

                  {booking.status !== "cancelled" && (
                    <button className="cancel-reservation" onClick={() => cancel(booking)} disabled={cancellingId === booking.id}>
                      {cancellingId === booking.id ? "Cancelling..." : "Cancel reservation"}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
