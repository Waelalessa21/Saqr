import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { fetchGameEntry, getToken } from "../../api";
import { UserBar } from "../shared/UserBar";
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
  const [starting, setStarting] = useState(false);

  const routeToEntry = async () => {
    const token = getToken();
    if (!token) return;

    setStarting(true);
    try {
      const entry = await fetchGameEntry(token);

      if (entry.action === "resume" && entry.session && entry.game_id) {
        navigate("/game", {
          state: {
            gameId: entry.game_id,
            categories: entry.session.categories,
            team1: entry.session.team1,
            team2: entry.session.team2,
            resume: {
              scores: [entry.session.score1, entry.session.score2],
              turn: entry.session.turn,
              answered: entry.session.answered,
              results: entry.session.results,
              usedPowerUps: entry.session.used_power_ups,
            },
          },
        });
        return;
      }

      if (entry.action === "new" && entry.game_id) {
        navigate("/select", {
          state: {
            gameId: entry.game_id,
            gameTitle: entry.game_title,
            gameNumber: entry.game_number,
            totalGames: entry.total_games,
            allCompleted: entry.all_completed,
          },
        });
        return;
      }

      navigate("/select");
    } catch {
      navigate("/select");
    } finally {
      setStarting(false);
    }
  };

  const handleStart = () => {
    if (!getToken()) {
      setShowAuth(true);
      return;
    }
    routeToEntry();
  };

  const handleAuthClose = (user?: { name: string; role: string }) => {
    setShowAuth(false);
    if (!user) return;
    setTimeout(() => {
      if (user.role === "admin") {
        navigate("/admin");
      } else {
        routeToEntry();
      }
    }, 350);
  };

  return (
    <div className={styles.page} dir="rtl" lang="ar">
      <div className={styles.backdrop} aria-hidden="true">
        <div className={styles.grain} />
      </div>

      <UserBar />

      <Spotlight />

      <main className={styles.content}>
        <Hero onStart={handleStart} starting={starting} />
        <Categories />
        <FinalCTA onStart={handleStart} starting={starting} />
      </main>

      <AnimatePresence>
        {showAuth && <AuthModal onClose={handleAuthClose} />}
      </AnimatePresence>
    </div>
  );
}
