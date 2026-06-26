import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import { auth, isFirebaseConfigured } from "../../firebase";
import { useLenis } from "../../hooks/useLenis";
import { Spotlight } from "./Spotlight";
import { Hero } from "./Hero";
import { Categories } from "./Categories";
import { FinalCTA } from "./FinalCTA";
import { AuthModal } from "../auth/AuthModal";
import styles from "./LandingPage.module.css";

export function LandingPage() {
  useLenis();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);

  const handleStart = () => {
    if (!isFirebaseConfigured || !auth) {
      navigate("/select");
      return;
    }
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (user) {
        navigate("/select");
      } else {
        setShowAuth(true);
      }
    });
  };

  const handleAuthClose = () => {
    setShowAuth(false);
    if (auth.currentUser) {
      navigate("/select");
    }
  };

  return (
    <div className={styles.page} dir="rtl" lang="ar">
      <div className={styles.backdrop} aria-hidden="true">
        <div className={styles.grain} />
      </div>

      <Spotlight />

      <main className={styles.content}>
        <Hero onStart={handleStart} />
        <Categories />
        <FinalCTA onStart={handleStart} />
      </main>

      <AnimatePresence>
        {showAuth && <AuthModal onClose={handleAuthClose} />}
      </AnimatePresence>
    </div>
  );
}
