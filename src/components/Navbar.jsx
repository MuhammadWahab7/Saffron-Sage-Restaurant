import { useEffect, useState } from "react";
import { getUserDisplayName } from "../context/AuthContext";

const links = [
  ["home", "Home"],
  ["story", "Our Story"],
  ["menu", "Menu"],
  ["events", "Events"],
  ["gallery", "Gallery"],
  ["visit", "Visit"],
  ["contact", "Contact"],
];

export default function Navbar({ onBook, onAccount, user, authLoading }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("nav-open", open);
    return () => document.body.classList.remove("nav-open");
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    const desktopQuery = window.matchMedia("(min-width: 1041px)");
    const closeOnDesktop = (event) => {
      if (event.matches) setOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    desktopQuery.addEventListener("change", closeOnDesktop);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      desktopQuery.removeEventListener("change", closeOnDesktop);
    };
  }, [open]);

  const goTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setOpen(false);
  };

  return (
    <header className={`navbar ${scrolled ? "navbar--scrolled" : ""} ${open ? "navbar--menu-open" : ""}`}>
      <button className="brand" onClick={() => goTo("home")} aria-label="Go to the Saffron and Sage homepage">
        <img
          className="brand__logo"
          src="/assets/saffron-sage-emblem.png"
          alt=""
          aria-hidden="true"
        />
        <span className="brand__wordmark">
          <strong>SAFFRON &amp; SAGE</strong>
          <small>GARDEN KITCHEN</small>
        </span>
      </button>

      <nav id="main-navigation" className={`nav-links ${open ? "nav-links--open" : ""}`} aria-label="Main navigation">
        {links.map(([id, label]) => (
          <button key={id} onClick={() => goTo(id)}>{label}</button>
        ))}

        <button
          className={`nav-account ${user ? "nav-account--signed-in" : ""}`}
          onClick={() => {
            setOpen(false);
            onAccount();
          }}
          disabled={authLoading}
          aria-label={user ? "Open my reservations" : "Sign in or log in"}
        >
          <span className="nav-account__icon" aria-hidden="true">
            {user ? (
              getUserDisplayName(user).charAt(0).toUpperCase()
            ) : (
              <svg viewBox="0 0 24 24" focusable="false">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5.5 19c.7-4 3-6 6.5-6s5.8 2 6.5 6" />
              </svg>
            )}
          </span>
          <div>
            <small>{user ? "My reservations" : "Customer account"}</small>
            <strong>{authLoading ? "Loading account..." : user ? getUserDisplayName(user) : "Sign in / Log in"}</strong>
          </div>
        </button>

        <button className="button button--small nav-book" onClick={() => { setOpen(false); onBook(); }}>
          Book a table
        </button>
      </nav>

      <button
        className={`menu-toggle ${open ? "menu-toggle--open" : ""}`}
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-controls="main-navigation"
        aria-expanded={open}
      >
        <span />
        <span />
      </button>
    </header>
  );
}
