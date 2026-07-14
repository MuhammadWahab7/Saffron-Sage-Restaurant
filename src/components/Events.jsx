import { events } from "../data";
import SectionHeading from "./SectionHeading";

export default function Events({ onBook }) {
  return (
    <section className="section events" id="events">
      <div className="container">
        <div className="events__top">
          <SectionHeading
            eyebrow="At Saffron & Sage"
            title="What’s happening."
            text="Join us for live music, special menus and family meals throughout the season."
          />
          <button className="text-button text-button--dark" onClick={onBook}>
            Ask about an event
          </button>
        </div>

        <div className="events-list">
          {events.map((event, index) => (
            <article className="event-row" key={event.title}>
              <span className="event-row__number">0{index + 1}</span>
              <div className="event-row__date">
                <strong>{event.day}</strong>
                <span>{event.month}</span>
              </div>
              <div className="event-row__body">
                <h3>{event.title}</h3>
                <p>{event.text}</p>
              </div>
              <span className="event-row__time">{event.time}</span>
              <button
                type="button"
                className="event-row__action"
                onClick={onBook}
                aria-label={`Book a table for ${event.title}`}
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
