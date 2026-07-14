export default function Footer({ onBook }) {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer__top">
        <div className="footer__intro">
          <a className="footer__logo-card" href="#home" aria-label="Saffron and Sage home">
            <img
              className="footer__logo"
              src="/assets/saffron-sage-logo.png"
              alt="Saffron and Sage Garden Kitchen"
            />
          </a>
          <h2>Good food. Friendly service.</h2>
          <button className="button" onClick={onBook}>
            Reserve a table <span>↗</span>
          </button>
        </div>

        <div className="footer__links">
          <div>
            <span>Explore</span>
            <a href="#story">Our story</a>
            <a href="#menu">Menu</a>
            <a href="#events">Events</a>
            <a href="#gallery">Gallery</a>
          </div>
          <div>
            <span>Visit</span>
            <a href="tel:+441234567890">+44 1234 567 890</a>
            <a href="mailto:hello@saffronandsage.co.uk">Email us</a>
            <a href="#visit">Opening hours</a>
            <a href="#contact">Contact form</a>
          </div>
          <div>
            <span>Follow</span>
            <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">
              Instagram ↗
            </a>
            <a href="https://www.facebook.com/" target="_blank" rel="noreferrer">
              Facebook ↗
            </a>
          </div>
        </div>
      </div>

      <div className="container footer__bottom">
        <span>© {year} Saffron & Sage</span>
        <span>Fresh food in a relaxed setting</span>
        <a href="#home">Back to top ↑</a>
      </div>
    </footer>
  );
}
