import { useEffect, useState } from "react";
import { galleryImages } from "../data";
import SectionHeading from "./SectionHeading";

export default function Gallery() {
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <section className="section gallery" id="gallery">
      <div className="container">
        <SectionHeading
          eyebrow="Inside our world"
          title="A place to slow down."
          text="Warm light, honest materials and tables made for long conversations."
          centered
        />

        <div className="gallery-grid">
          {galleryImages.map((image, index) => (
            <button
              className={`gallery-item gallery-item--${index + 1}`}
              key={image.src}
              onClick={() => setSelected(image)}
              aria-label={`Open image: ${image.alt}`}
            >
              <img src={image.src} alt={image.alt} />
              <span>View image ↗</span>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setSelected(null)}>
          <button
            className="lightbox__close"
            onClick={() => setSelected(null)}
            aria-label="Close gallery image"
          >
            ×
          </button>
          <img src={selected.src} alt={selected.alt} onClick={(event) => event.stopPropagation()} />
          <p>{selected.alt}</p>
        </div>
      )}
    </section>
  );
}
