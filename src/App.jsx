import { useCallback, useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Story from "./components/Story";
import Menu from "./components/Menu";
import Events from "./components/Events";
import Gallery from "./components/Gallery";
import Testimonials from "./components/Testimonials";
import Visit from "./components/Visit";
import ContactForm from "./components/ContactForm";
import BookingModal from "./components/BookingModal";
import AuthModal from "./components/AuthModal";
import MyReservationsModal from "./components/MyReservationsModal";
import Footer from "./components/Footer";
import Chatbot from "./components/Chatbot";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { user, loading, passwordRecovery } = useAuth();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [reservationsOpen, setReservationsOpen] = useState(false);
  const [preferredDish, setPreferredDish] = useState("");
  const [pendingBooking, setPendingBooking] = useState(null);

  useEffect(() => {
    if (!passwordRecovery) return;
    setPendingBooking(null);
    setAuthOpen(true);
  }, [passwordRecovery]);

  const openBooking = useCallback(
    (dish = "") => {
      const selectedDish = typeof dish === "string" ? dish : "";
      if (!user) {
        setPendingBooking({ dish: selectedDish });
        setAuthOpen(true);
        return;
      }
      setPreferredDish(selectedDish);
      setBookingOpen(true);
    },
    [user],
  );

  const closeBooking = useCallback(() => {
    setBookingOpen(false);
    setPreferredDish("");
  }, []);

  const handleAuthenticated = useCallback(() => {
    setAuthOpen(false);
    if (pendingBooking) {
      setPreferredDish(pendingBooking.dish);
      setPendingBooking(null);
      window.setTimeout(() => setBookingOpen(true), 120);
    }
  }, [pendingBooking]);

  const openAccount = useCallback(() => {
    if (user) setReservationsOpen(true);
    else setAuthOpen(true);
  }, [user]);

  return (
    <>
      <Navbar
        onBook={openBooking}
        onAccount={openAccount}
        user={user}
        authLoading={loading}
      />
      <main>
        <Hero onBook={openBooking} />
        <Story onBook={openBooking} />
        <Menu onReserve={openBooking} />
        <Events onBook={openBooking} />
        <Gallery />
        <Testimonials />
        <Visit onBook={openBooking} />
        <ContactForm />
      </main>
      <Footer onBook={openBooking} />
      <Chatbot onBook={openBooking} />

      <AuthModal
        open={authOpen}
        purpose={pendingBooking ? "booking" : "account"}
        onClose={() => {
          setAuthOpen(false);
          setPendingBooking(null);
        }}
        onAuthenticated={handleAuthenticated}
      />

      <BookingModal
        open={bookingOpen}
        onClose={closeBooking}
        preferredDish={preferredDish}
      />

      <MyReservationsModal
        open={reservationsOpen}
        onClose={() => setReservationsOpen(false)}
        onBook={openBooking}
      />
    </>
  );
}
