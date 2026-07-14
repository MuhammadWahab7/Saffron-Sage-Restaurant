import ActionArrow from "./ActionArrow";
import SectionHeading from "./SectionHeading";

export default function Story({ onBook }) {
  return (
    <section className="section story" id="story">
      <div className="container story__grid">
        <div className="story__visual">
          <img
            className="story__image story__image--main"
            src="https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1100&q=85"
            alt="Warm restaurant dining space"
          />
          <img
            className="story__image story__image--small"
            src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=700&q=85"
            alt="Chef preparing a dish"
          />
          <div className="story__badge">
            <strong>10+</strong>
            <span>years around the table</span>
          </div>
        </div>

        <div className="story__content">
          <SectionHeading
            eyebrow="Our story"
            title="Simple food, done well."
            text="We opened Saffron & Sage to create the kind of restaurant we enjoy visiting ourselves: relaxed, welcoming and serious about good food."
          />
          <p>
            We buy from local growers, bakers and suppliers whenever we can. The menu changes through the year, but the idea stays simple: familiar food, fresh ingredients and plenty of flavour.
          </p>

          <div className="story__features">
            <div>
              <span>01</span>
              <h3>Locally sourced</h3>
              <p>We choose fresh ingredients from suppliers we know and trust.</p>
            </div>
            <div>
              <span>02</span>
              <h3>Made in our kitchen</h3>
              <p>Bread, sauces and desserts are prepared by our kitchen team each day.</p>
            </div>
          </div>

          <button className="button button--dark" onClick={onBook}>
            Dine with us <ActionArrow />
          </button>
        </div>
      </div>
    </section>
  );
}
