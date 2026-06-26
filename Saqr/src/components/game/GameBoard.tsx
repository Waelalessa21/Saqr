import { useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { categories as allCategories } from "../../data/categories";
import { Spotlight } from "../landing/Spotlight";
import styles from "./GameBoard.module.css";

const POINTS = [200, 400, 600];

const toArabicNum = (n: number) =>
  n === 0 ? "صفر" : String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]);

type PowerUp = "multi" | "double" | "call";

const powerUps: { id: PowerUp; icon: string; title: string }[] = [
  { id: "multi", icon: "🃏", title: "خيارات متعددة" },
  { id: "double", icon: "✨", title: "نقاط مضاعفة" },
  { id: "call", icon: "📞", title: "اتصل بصديق" },
];

export function GameBoard() {
  const location = useLocation();
  const {
    categories: catIds = [],
    team1 = "الفريق ١",
    team2 = "الفريق ٢",
  } = location.state ?? {};

  const cats = (catIds as number[])
    .map((id: number) => allCategories.find((c) => c.id === id)!)
    .filter(Boolean);

  const [scores, setScores] = useState([0, 0]);
  const [turn, setTurn] = useState(0);
  const [answered, setAnswered] = useState<Set<string>>(new Set());
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const [usedPowerUps, setUsedPowerUps] = useState<[PowerUp[], PowerUp[]]>([[], []]);

  const handleCellClick = (catId: number, points: number, q: number) => {
    const key = `${catId}-${points}-${q}`;
    if (answered.has(key)) return;
    setActiveCell(key);
  };

  const handleAnswer = (correct: boolean) => {
    if (!activeCell) return;
    const points = parseInt(activeCell.split("-")[1]);

    if (correct) {
      setScores((prev) => {
        const next = [...prev];
        next[turn] += points;
        return next;
      });
    }

    setAnswered((prev) => new Set(prev).add(activeCell));
    setActiveCell(null);
    setTurn((prev) => (prev === 0 ? 1 : 0));
  };

  const usePowerUp = (pu: PowerUp) => {
    if (usedPowerUps[turn].includes(pu)) return;
    setUsedPowerUps((prev) => {
      const next: [PowerUp[], PowerUp[]] = [[...prev[0]], [...prev[1]]];
      next[turn] = [...next[turn], pu];
      return next;
    });
  };

  return (
    <div className={styles.page} dir="rtl" lang="ar">
      <div className={styles.backdrop} aria-hidden="true">
        <div className={styles.grain} />
      </div>
      <Spotlight />

      <div className={styles.content}>
        {/* Scoreboard */}
        <div className={styles.scoreboard}>
          <div className={`${styles.teamCard} ${turn === 0 ? styles.teamActive : ""}`}>
            <span className={styles.teamLabel}>{team1}</span>
            <span className={styles.teamScore}>{toArabicNum(scores[0])}</span>
            <div className={styles.teamPowerUps}>
              {powerUps.map((pu) => (
                <button
                  key={pu.id}
                  className={`${styles.puBtn} ${usedPowerUps[0].includes(pu.id) ? styles.puUsed : ""}`}
                  onClick={() => turn === 0 && usePowerUp(pu.id)}
                  disabled={turn !== 0 || usedPowerUps[0].includes(pu.id)}
                  title={pu.title}
                >
                  {pu.icon}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.turnBadge}>
            <span className={styles.turnLabel}>دور</span>
            <span className={styles.turnName}>{turn === 0 ? team1 : team2}</span>
          </div>

          <div className={`${styles.teamCard} ${turn === 1 ? styles.teamActive : ""}`}>
            <span className={styles.teamLabel}>{team2}</span>
            <span className={styles.teamScore}>{toArabicNum(scores[1])}</span>
            <div className={styles.teamPowerUps}>
              {powerUps.map((pu) => (
                <button
                  key={pu.id}
                  className={`${styles.puBtn} ${usedPowerUps[1].includes(pu.id) ? styles.puUsed : ""}`}
                  onClick={() => turn === 1 && usePowerUp(pu.id)}
                  disabled={turn !== 1 || usedPowerUps[1].includes(pu.id)}
                  title={pu.title}
                >
                  {pu.icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Board grid */}
        <div className={styles.board} style={{ "--cols": cats.length } as React.CSSProperties}>
          {/* Category headers */}
          {cats.map((cat) => (
            <div key={cat.id} className={styles.catHeader}>
              <span className={styles.catIcon}>{cat.icon}</span>
              <span className={styles.catName}>{cat.title}</span>
            </div>
          ))}

          {/* Point cells — 2 per level per category */}
          {POINTS.flatMap((pts) =>
            [1, 2].flatMap((q) =>
              cats.map((cat) => {
                const key = `${cat.id}-${pts}-${q}`;
                const isAnswered = answered.has(key);
                const isActive = activeCell === key;

                return (
                  <motion.button
                    key={key}
                    className={`${styles.cell} ${isAnswered ? styles.cellDone : ""} ${isActive ? styles.cellActive : ""}`}
                    onClick={() => handleCellClick(cat.id, pts, q)}
                    disabled={isAnswered}
                    whileTap={!isAnswered ? { scale: 0.95 } : undefined}
                  >
                    {isAnswered ? "" : toArabicNum(pts)}
                  </motion.button>
                );
              }),
            ),
          )}
        </div>

        {/* Question overlay */}
        <AnimatePresence>
          {activeCell && (
            <motion.div
              className={styles.overlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className={styles.questionCard}
                initial={{ opacity: 0, scale: 0.92, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 30 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className={styles.qPoints}>
                  {toArabicNum(parseInt(activeCell.split("-")[1]))} نقطة
                </span>
                <p className={styles.qText}>السؤال يظهر هنا...</p>
                <div className={styles.qActions}>
                  <button
                    className={styles.qBtn}
                    data-correct
                    onClick={() => handleAnswer(true)}
                  >
                    ✓ صحيح
                  </button>
                  <button
                    className={styles.qBtn}
                    data-wrong
                    onClick={() => handleAnswer(false)}
                  >
                    ✗ خطأ
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
