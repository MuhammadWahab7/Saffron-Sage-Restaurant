import { useEffect, useState } from "react";
import { testimonials } from "../data";

export default function Testimonials() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setActive((current) => (current + 1) % testimonials.length),
      6000
    );
    return () => window.clearInterval(timer);
  }, []);

  const testimonial = testimonials[active];

  return (
    <section className="testimonials" aria-label="Guest testimonials">
      <div className="testimonials__image" />
      <div className="testimonials__panel">
        <span className="eyebrow">Guest notes</span>
        <div className="stars" aria-label="5 out of 5 stars">
          ★ ★ ★ ★ ★
        </div>
        <blockquote>“{testimonial.quote}”</blockquote>
        <div className="testimonial-author">
          <div className="testimonial-author__line" />
          <div>
            <strong>{testimonial.name}</strong>
            <span>{testimonial.role}</span>
          </div>
        </div>
        <div className="testimonial-controls">
          <button
            onClick={() =>
              setActive((current) =>
                current === 0 ? testimonials.length - 1 : current - 1
              )
            }
            aria-label="Previous testimonial"
          >
            ←
          </button>
          <span>
            0{active + 1} / 0{testimonials.length}
          </span>
          <button
            onClick={() =>
              setActive((current) => (current + 1) % testimonials.length)
            }
            aria-label="Next testimonial"
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}
