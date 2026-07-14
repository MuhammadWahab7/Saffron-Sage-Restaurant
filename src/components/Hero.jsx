export default function Hero({ onBook }) {
  const scrollToMenu = () =>
    document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className="hero" id="home">
      <div className="hero__overlay" />
      <div className="hero__glow hero__glow--one" aria-hidden="true" />
      <div className="hero__glow hero__glow--two" aria-hidden="true" />

      <div className="hero__content container">
        <span className="hero__eyebrow">Fresh food. Relaxed setting.</span>
        <h1>
          Good food,
          <em>made to be shared.</em>
        </h1>
        <p>
          We serve seasonal food in a relaxed garden setting. Join us for lunch, dinner, drinks or a special evening.
        </p>
        <div className="hero__actions">
          <button className="button" onClick={onBook}>
            Reserve your table <span>↗</span>
          </button>
          <button className="text-button" onClick={scrollToMenu}>
            Discover the menu <span>↓</span>
          </button>
        </div>
      </div>

      <aside className="hero__floating-card" aria-label="Restaurant highlights">
        <span className="hero__floating-label">Guest favourite</span>
        <div className="hero__rating">
          <strong>4.9</strong>
          <span>★★★★★</span>
        </div>
        <p>Good food, friendly service and a calm garden atmosphere.</p>
        <div className="hero__floating-line" />
        <small>Fresh ingredients. Made in our kitchen.</small>
      </aside>

      <div className="hero__details">
        <span>Open Tuesday to Sunday</span>
        <span className="hero__details-line" />
        <span>Willow Lane, Brambleford</span>
      </div>

      <div className="scroll-cue" aria-hidden="true">
        <span>SCROLL</span>
        <i />
      </div>
    </section>
  );
}
