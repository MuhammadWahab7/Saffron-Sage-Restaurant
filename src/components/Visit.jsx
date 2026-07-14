import SectionHeading from "./SectionHeading";

const hours = [
  ["Monday", "Closed"],
  ["Tuesday to Thursday", "12:00 to 22:00"],
  ["Friday and Saturday", "12:00 to 23:00"],
  ["Sunday", "12:00 to 20:00"],
];

export default function Visit({ onBook }) {
  return (
    <section className="section visit" id="visit">
      <div className="container visit__grid">
        <div>
          <SectionHeading
            eyebrow="Come and see us"
            title="Come by for a meal."
            text="Visit us for lunch, dinner, drinks or a relaxed Sunday meal."
          />

          <div className="contact-details">
            <a href="tel:+441234567890">
              <span>Call</span>
              +44 1234 567 890
            </a>
            <a href="mailto:hello@saffronandsage.co.uk">
              <span>Email</span>
              hello@saffronandsage.co.uk
            </a>
            <div>
              <span>Find us</span>
              14 Willow Lane, Brambleford, UK
            </div>
          </div>

          <button className="button button--dark" onClick={onBook}>
            Book a table <span>↗</span>
          </button>
        </div>

        <div className="hours-card">
          <span className="hours-card__label">OPENING HOURS</span>
          <h3>Plan your visit</h3>
          <div className="hours-list">
            {hours.map(([day, time]) => (
              <div key={day}>
                <span>{day}</span>
                <strong>{time}</strong>
              </div>
            ))}
          </div>
          <p>The kitchen closes 30 minutes before closing time.</p>
          <div className="hours-card__seal">
            <span>EST.</span>
            <strong>2016</strong>
            <span>BRAMBLEFORD</span>
          </div>
        </div>
      </div>
    </section>
  );
}
