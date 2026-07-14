import { useEffect } from "react";
import ActionArrow from "./ActionArrow";

export default function MenuDetailModal({ item, isFavourite, onToggleFavourite, onClose, onReserve }) {
  useEffect(() => {
    if (!item) return undefined;

    document.body.classList.add("modal-open");
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div className="modal-scroll-shell dish-modal-backdrop" onMouseDown={onClose}>
      <article
        className="dish-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dish-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="dish-modal__close" onClick={onClose} aria-label="Close dish details">
          ×
        </button>

        <div className="dish-modal__visual">
          <img src={item.image} alt={item.name} />
          <div className="dish-modal__visual-overlay" />
          <span className="dish-modal__category">{item.category}</span>
          <button
            className={`dish-modal__favourite ${isFavourite ? "is-active" : ""}`}
            onClick={() => onToggleFavourite(item.id)}
            aria-label={isFavourite ? "Remove from favourites" : "Add to favourites"}
          >
            {isFavourite ? "♥" : "♡"}
          </button>
          <div className="dish-modal__visual-copy">
            <span>Dish details</span>
            <strong>{item.price}</strong>
          </div>
        </div>

        <div className="dish-modal__content">
          <span className="eyebrow">About this dish</span>
          <h2 id="dish-modal-title">{item.name}</h2>
          <p className="dish-modal__lead">{item.longDescription}</p>

          <div className="dish-meta-grid">
            <div><span>Energy</span><strong>{item.calories}</strong></div>
            <div><span>Preparation time</span><strong>{item.prepTime}</strong></div>
            <div><span>Heat</span><strong>{item.spice}</strong></div>
          </div>

          <div className="dish-detail-columns">
            <section>
              <h3>Ingredients</h3>
              <div className="ingredient-cloud">
                {item.ingredients.map((ingredient) => <span key={ingredient}>{ingredient}</span>)}
              </div>
            </section>

            <section>
              <h3>Dietary notes</h3>
              <div className="dietary-cloud">
                {item.dietary.map((tag) => <span key={tag}>✓ {tag}</span>)}
              </div>
            </section>
          </div>

          <section className="flavour-profile">
            <div className="flavour-profile__heading">
              <h3>What it tastes like</h3>
              <span>A quick guide</span>
            </div>
            {Object.entries(item.flavour).map(([label, value]) => (
              <div className="flavour-row" key={label}>
                <span>{label}</span>
                <div><i style={{ width: `${value}%` }} /></div>
                <strong>{value}</strong>
              </div>
            ))}
          </section>

          <div className="chef-note">
            <span>Chef’s note</span>
            <p>{item.chefNote}</p>
          </div>

          <div className="dish-info-cards">
            <div>
              <span>Where it came from</span>
              <p>{item.origin}</p>
            </div>
            <div>
              <span>Goes well with</span>
              <p>{item.pairing}</p>
            </div>
          </div>

          <div className="allergen-alert">
            <strong>Allergens</strong>
            <span>{item.allergens.join(", ")}</span>
          </div>

          <div className="dish-modal__actions">
            <button className="button button--dark" onClick={() => onReserve(item)}>
              Reserve with this dish <ActionArrow />
            </button>
            <button className="dish-modal__secondary" onClick={() => onToggleFavourite(item.id)}>
              {isFavourite ? "♥ Saved to favourites" : "♡ Save for later"}
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
