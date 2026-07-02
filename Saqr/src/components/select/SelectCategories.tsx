import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { fetchGameEntry, getToken } from "../../api";
import { categories } from "../../data/categories";
import { Spotlight } from "../landing/Spotlight";
import { UserBar } from "../shared/UserBar";
import styles from "./SelectCategories.module.css";

const MAX = 6;

export function SelectCategories() {
  const location = useLocation();
  const navigate = useNavigate();
  const gameId: number | undefined = location.state?.gameId;
  const gameTitle: string | undefined = location.state?.gameTitle;
  const gameNumber: number | undefined = location.state?.gameNumber;
  const totalGames: number | undefined = location.state?.totalGames;
  const allCompleted: boolean | undefined = location.state?.allCompleted;
  const restored: number[] = location.state?.categories ?? [];
  const [selected, setSelected] = useState<number[]>(restored);

  const toArabicNum = (n: number) =>
    String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]);

  const gameLabel = gameNumber && totalGames
    ? `اللعبة ${toArabicNum(gameNumber)} من ${toArabicNum(totalGames)}`
    : gameTitle;

  useEffect(() => {
    if (gameId || !getToken()) return;
    fetchGameEntry(getToken()!)
      .then((entry) => {
        if (entry.action === "resume" && entry.session && entry.game_id) {
          navigate("/game", {
            replace: true,
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
            replace: true,
            state: {
              gameId: entry.game_id,
              gameTitle: entry.game_title,
              gameNumber: entry.game_number,
              totalGames: entry.total_games,
              allCompleted: entry.all_completed,
            },
          });
        }
      })
      .catch(() => {});
  }, [gameId, navigate]);

  useEffect(() => {
    const token = getToken();
    if (!token || !gameId) return;
    fetchGameEntry(token)
      .then((entry) => {
        if (entry.action === "resume" && entry.game_id) {
          navigate("/", { replace: true });
          return;
        }
        if (entry.action === "new" && entry.game_id && entry.game_id !== gameId) {
          navigate("/select", {
            replace: true,
            state: {
              gameId: entry.game_id,
              gameTitle: entry.game_title,
              gameNumber: entry.game_number,
              totalGames: entry.total_games,
              allCompleted: entry.all_completed,
            },
          });
        }
      })
      .catch(() => {});
  }, [gameId, navigate]);

  const toggle = (id: number) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((s) => s !== id)
        : prev.length < MAX
          ? [...prev, id]
          : prev,
    );
  };

  return (
    <div className={styles.page} dir="rtl" lang="ar">
      <div className={styles.backdrop} aria-hidden="true">
        <div className={styles.grain} />
      </div>

      <Spotlight />
      <UserBar />

      <div className={styles.content}>
        <div className={styles.header}>
          <Link to="/" className={styles.backLink}>
            → الرجوع
          </Link>
          <h1 className={styles.title}>اختر فئاتك</h1>
          {gameLabel && (
            <p className={styles.gameLabel}>
              {gameLabel}
              {allCompleted ? " — إعادة من البداية" : ""}
            </p>
          )}
          <p className={styles.subtitle}>
            اختر ٦ فئات من بين ١٢ لبدء المواجهة
          </p>
          <div className={styles.counterRow}>
            <span className={styles.counter}>
              {toArabicNum(selected.length)} / {toArabicNum(MAX)}
            </span>
            {selected.length > 0 && (
              <button
                className={styles.deselectAll}
                onClick={() => setSelected([])}
              >
                إلغاء الكل
              </button>
            )}
          </div>
        </div>

        <div className={styles.grid}>
          {categories.map((cat) => {
            const isSelected = selected.includes(cat.id);
            const isDisabled = !isSelected && selected.length >= MAX;

            return (
              <motion.article
                key={cat.id}
                className={`${styles.card} ${isSelected ? styles.cardSelected : ""} ${isDisabled ? styles.cardDisabled : ""}`}
                onClick={() => toggle(cat.id)}
                whileTap={{ scale: 0.97 }}
                layout
              >
                <AnimatePresence>
                  {isSelected && (
                    <motion.span
                      className={styles.checkMark}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      ✓
                    </motion.span>
                  )}
                </AnimatePresence>
                <span className={styles.cardIcon} aria-hidden="true">
                  {cat.icon}
                </span>
                <h4 className={styles.cardTitle}>{cat.title}</h4>
                <p className={styles.cardBlurb}>{cat.blurb}</p>
              </motion.article>
            );
          })}
        </div>

        <div className={styles.footer}>
          <button
            className={styles.startBtn}
            disabled={selected.length < MAX}
            onClick={() => navigate("/teams", { state: { categories: selected, gameId } })}
          >
            حدد الفرق
            <span className={styles.btnGlow} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
