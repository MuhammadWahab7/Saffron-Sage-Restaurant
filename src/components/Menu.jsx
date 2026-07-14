import { useEffect, useMemo, useRef, useState } from "react";
import { menuItems } from "../data";
import SectionHeading from "./SectionHeading";
import MenuDetailModal from "./MenuDetailModal";

const categories = ["All", "Starters", "Mains", "Desserts", "Drinks"];

export default function Menu({ onReserve }) {
  const tabsRef = useRef(null);
  const categoryButtonRefs = useRef({});
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [favourites, setFavourites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("saffron-sage-favourites")) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("saffron-sage-favourites", JSON.stringify(favourites));
  }, [favourites]);

  useEffect(() => {
    if (favourites.length === 0 && favouritesOnly) setFavouritesOnly(false);
  }, [favourites, favouritesOnly]);

  useEffect(() => {
    const tabs = tabsRef.current;
    const activeButton = categoryButtonRefs.current[activeCategory];
    if (!tabs || !activeButton || tabs.scrollWidth <= tabs.clientWidth) return;

    const centeredPosition =
      activeButton.offsetLeft - (tabs.clientWidth - activeButton.offsetWidth) / 2;
    const maximumScroll = tabs.scrollWidth - tabs.clientWidth;

    tabs.scrollTo({
      left: Math.max(0, Math.min(centeredPosition, maximumScroll)),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, [activeCategory]);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return menuItems.filter((item) => {
      const categoryMatches = activeCategory === "All" || item.category === activeCategory;
      const searchMatches =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.ingredients.some((ingredient) => ingredient.toLowerCase().includes(query));
      const favouriteMatches = !favouritesOnly || favourites.includes(item.id);
      return categoryMatches && searchMatches && favouriteMatches;
    });
  }, [activeCategory, search, favouritesOnly, favourites]);

  const toggleFavourite = (id) => {
    setFavourites((current) =>
      current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]
    );
  };

  const reserveDish = (item) => {
    setSelectedItem(null);
    onReserve(item.name);
  };

  return (
    <section className="section menu-section" id="menu">
      <div className="container">
        <SectionHeading
          eyebrow="The menu"
          title="Season-led. Full of stories."
          text="Open any dish to explore its ingredients, allergens, flavour profile, chef's note and ideal pairing."
          centered
        />

        <div className="menu-discovery-bar">
          <label className="menu-search">
            <span>⌕</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search dishes or ingredients..."
              aria-label="Search menu"
              autoComplete="off"
              spellCheck="false"
            />
          </label>
          <button
            className={`favourites-filter ${favouritesOnly ? "is-active" : ""}`}
            onClick={() => setFavouritesOnly((current) => !current)}
            disabled={favourites.length === 0}
            aria-pressed={favouritesOnly}
            title={favourites.length === 0 ? "Add a dish to favourites to use this filter" : undefined}
          >
            <span>{favouritesOnly ? "♥" : "♡"}</span>
            Favourites
            <strong>{favourites.length}</strong>
          </button>
        </div>

        <div ref={tabsRef} className="menu-tabs" role="tablist" aria-label="Menu categories">
          {categories.map((category) => (
            <button
              key={category}
              ref={(node) => {
                categoryButtonRefs.current[category] = node;
              }}
              type="button"
              className={activeCategory === category ? "active" : ""}
              onClick={() => setActiveCategory(category)}
              role="tab"
              aria-selected={activeCategory === category}
            >
              {category}
            </button>
          ))}
        </div>

        {visibleItems.length > 0 ? (
          <div className="menu-grid">
            {visibleItems.map((item) => {
              const isFavourite = favourites.includes(item.id);
              return (
                <article className="menu-card menu-card--interactive" key={item.id}>
                  <button
                    className="menu-card__favourite"
                    onClick={() => toggleFavourite(item.id)}
                    aria-label={isFavourite ? `Remove ${item.name} from favourites` : `Add ${item.name} to favourites`}
                  >
                    {isFavourite ? "♥" : "♡"}
                  </button>

                  <button className="menu-card__open" onClick={() => setSelectedItem(item)}>
                    <div className="menu-card__image-wrap">
                      <img src={item.image} alt={item.name} className="menu-card__image" />
                      <span>{item.category}</span>
                      <div className="menu-card__reveal">View details <b>↗</b></div>
                    </div>
                    <div className="menu-card__content">
                      <div>
                        <h3>{item.name}</h3>
                        <p>{item.description}</p>
                        <div className="menu-card__tags">
                          {item.dietary.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}
                        </div>
                      </div>
                      <strong>{item.price}</strong>
                    </div>
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="menu-empty-state">
            <span>✦</span>
            <h3>No dishes found</h3>
            <p>Try another ingredient, category or turn off the favourites filter.</p>
            <button onClick={() => { setSearch(""); setFavouritesOnly(false); setActiveCategory("All"); }}>
              Reset menu
            </button>
          </div>
        )}

        <p className="menu-note">
          Dietary details are provided as guidance. Guests with allergies should always speak to the restaurant team before ordering.
        </p>
      </div>

      <MenuDetailModal
        item={selectedItem}
        isFavourite={selectedItem ? favourites.includes(selectedItem.id) : false}
        onToggleFavourite={toggleFavourite}
        onClose={() => setSelectedItem(null)}
        onReserve={reserveDish}
      />
    </section>
  );
}
