import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { categories as allCategories } from "../../data/categories";
import { getToken, saveGameSession, fetchGameEntry, type GameEntry } from "../../api";
import { Spotlight } from "../landing/Spotlight";
import styles from "./GameBoard.module.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const POINTS = [200, 400, 600];
const TIMER_SECONDS = 60;
const STEAL_SECONDS = 30;

type GameQuestion = {
  id: number;
  category_id: number;
  points: number;
  text: string;
  options: string[] | null;
};

const toArabicNum = (n: number) =>
  n === 0 ? "صفر" : String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]);

type PowerUp = "multi" | "double" | "call";
type QPhase = "question" | "steal" | "who-answered";

const powerUps: { id: PowerUp; icon: string; title: string }[] = [
  { id: "multi", icon: "🃏", title: "خيارات متعددة" },
  { id: "double", icon: "✨", title: "نقاط مضاعفة" },
  { id: "call", icon: "📞", title: "اتصل بصديق" },
];

type ResumeState = {
  scores: [number, number];
  turn: number;
  answered: string[];
  results: Record<string, "correct" | "wrong">;
  usedPowerUps: [PowerUp[], PowerUp[]];
};

export function GameBoard() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    categories: catIds = [],
    team1 = "الفريق ١",
    team2 = "الفريق ٢",
    gameId,
    resume,
  } = (location.state ?? {}) as {
    categories?: number[];
    team1?: string;
    team2?: string;
    gameId?: number;
    resume?: ResumeState;
  };

  const cats = (catIds as number[])
    .map((id: number) => allCategories.find((c) => c.id === id)!)
    .filter(Boolean);

  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [scores, setScores] = useState<[number, number]>(resume?.scores ?? [0, 0]);
  const [turn, setTurn] = useState(resume?.turn ?? 0);
  const [answered, setAnswered] = useState<Set<string>>(new Set(resume?.answered ?? []));
  const [results, setResults] = useState<Record<string, "correct" | "wrong">>(resume?.results ?? {});
  const [flashCell, setFlashCell] = useState<string | null>(null);
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const [usedPowerUps, setUsedPowerUps] = useState<[PowerUp[], PowerUp[]]>(
    resume?.usedPowerUps ?? [[], []],
  );
  const [timer, setTimer] = useState(TIMER_SECONDS);
  const [phase, setPhase] = useState<QPhase>("question");
  const [activePowerUps, setActivePowerUps] = useState<PowerUp[]>([]);
  const [revealedAnswer, setRevealedAnswer] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [activeGameId, setActiveGameId] = useState<number | undefined>(gameId);
  const [gameTitle, setGameTitle] = useState<string>("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setActiveGameId(gameId);
      return;
    }

    fetchGameEntry(token)
      .then((entry) => {
        if (entry.action === "resume" && entry.game_id) {
          setActiveGameId(entry.game_id);
          if (entry.game_title) setGameTitle(entry.game_title);
          return;
        }
        if (entry.game_id) {
          setActiveGameId(entry.game_id);
          if (entry.game_title) setGameTitle(entry.game_title);
        }
      })
      .catch(() => {
        if (gameId) setActiveGameId(gameId);
      });
  }, [gameId]);

  useEffect(() => {
    const fetchQuestions = async () => {
      let id = activeGameId;
      if (!id) {
        const token = getToken();
        if (token) {
          try {
            const entry = await fetchGameEntry(token);
            id = entry.game_id;
            if (entry.game_title) setGameTitle(entry.game_title);
          } catch {
            /* fall through */
          }
        }
      }
      if (!id) return;
      const res = await fetch(`${API}/api/games/${id}`);
      const game = await res.json();
      if (game?.questions) setQuestions(game.questions);
      if (game?.title) setGameTitle(game.title);
    };
    fetchQuestions().catch(() => {});
  }, [activeGameId]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback((seconds = TIMER_SECONDS) => {
    stopTimer();
    setTimer(seconds);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          stopTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer]);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  useEffect(() => {
    if (timer !== 0 || !activeCell) return;

    if (phase === "question") {
      setTurn((prev) => (prev === 0 ? 1 : 0));
      setPhase("steal");
      setActivePowerUps([]);
      startTimer(STEAL_SECONDS);
    } else if (phase === "steal") {
      const cell = activeCell;
      setResults((prev) => ({ ...prev, [cell]: "wrong" }));
      setFlashCell(cell);
      setActiveCell(null);
      setPhase("question");
      setTimeout(() => {
        setAnswered((prev) => new Set(prev).add(cell));
        setFlashCell(null);
        setTurn((prev) => (prev === 0 ? 1 : 0));
      }, 1200);
    }
  }, [timer, activeCell, phase, startTimer]);

  const getQuestion = (catId: number, pts: number, q: number): GameQuestion | undefined => {
    const matching = questions.filter((qn) => qn.category_id === catId && qn.points === pts);
    return matching[q - 1];
  };

  const handleCellClick = (catId: number, points: number, q: number) => {
    const key = `${catId}-${points}-${q}`;
    if (answered.has(key)) return;
    setActiveCell(key);
    setPhase("question");
    setActivePowerUps([]);
    setRevealedAnswer(null);
    startTimer();
  };

  const handleNext = () => {
    stopTimer();
    if (!activeCell) { setPhase("who-answered"); return; }
    const [cId, pts, qIdx] = activeCell.split("-").map(Number);
    const q = getQuestion(cId, pts, qIdx);
    if (q) {
      fetch(`${API}/api/games/questions/${q.id}/answer`)
        .then((r) => r.json())
        .then((data) => setRevealedAnswer(data.answer))
        .catch(() => {});
    }
    setPhase("who-answered");
  };

  const handleTeamAnswered = (teamIndex: number) => {
    if (!activeCell) return;
    const basePoints = parseInt(activeCell.split("-")[1]);
    const points = activePowerUps.includes("double") ? basePoints * 2 : basePoints;
    const cell = activeCell;

    setScores((prev) => {
      const next: [number, number] = [...prev];
      next[teamIndex] += points;
      return next;
    });

    setResults((prev) => ({ ...prev, [cell]: "correct" }));
    setFlashCell(cell);
    setActiveCell(null);
    setPhase("question");

    setTimeout(() => {
      setAnswered((prev) => new Set(prev).add(cell));
      setFlashCell(null);
      setTurn((prev) => (prev === 0 ? 1 : 0));
    }, 1200);
  };

  const handleNoOneAnswered = () => {
    if (!activeCell) return;
    const cell = activeCell;

    setResults((prev) => ({ ...prev, [cell]: "wrong" }));
    setFlashCell(cell);
    setActiveCell(null);
    setPhase("question");

    setTimeout(() => {
      setAnswered((prev) => new Set(prev).add(cell));
      setFlashCell(null);
      setTurn((prev) => (prev === 0 ? 1 : 0));
    }, 1200);
  };

  const usePowerUp = (pu: PowerUp) => {
    if (usedPowerUps[turn].includes(pu)) return;
    setUsedPowerUps((prev) => {
      const next: [PowerUp[], PowerUp[]] = [[...prev[0]], [...prev[1]]];
      next[turn] = [...next[turn], pu];
      return next;
    });
    setActivePowerUps((prev) => [...prev, pu]);
    if (pu === "call") stopTimer();
  };

  const totalCells = cats.length * POINTS.length * 2;
  const gameOver = totalCells > 0 && answered.size >= totalCells;
  const winner = scores[0] > scores[1] ? 0 : scores[1] > scores[0] ? 1 : -1;
  const [resultSaved, setResultSaved] = useState(false);
  const [nextEntry, setNextEntry] = useState<GameEntry | null>(null);
  const answeredKey = [...answered].sort().join("|");

  useEffect(() => {
    const token = getToken();
    if (!token || !activeGameId || catIds.length < 6 || gameOver) return;

    saveGameSession(token, {
      game_id: activeGameId,
      categories: catIds as number[],
      team1,
      team2,
      score1: scores[0],
      score2: scores[1],
      turn,
      answered: [...answered],
      results,
      used_power_ups: usedPowerUps,
    }).catch(() => {});
  }, [activeGameId, catIds, team1, team2, scores, turn, answeredKey, results, usedPowerUps, gameOver]);

  useEffect(() => {
    if (!gameOver || resultSaved || !activeGameId) return;
    setResultSaved(true);
    const token = getToken();
    fetch(`${API}/api/games/results`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        game_id: activeGameId,
        team1,
        team2,
        score1: scores[0],
        score2: scores[1],
        winner: winner === -1 ? null : winner === 0 ? team1 : team2,
        categories: catIds,
      }),
    })
      .then(() => {
        if (token) {
          return fetchGameEntry(token).then(setNextEntry).catch(() => {});
        }
      })
      .catch(() => {});
  }, [gameOver, resultSaved, activeGameId, team1, team2, scores, winner, catIds]);

  const startNextGame = () => {
    if (nextEntry?.action === "new" && nextEntry.game_id) {
      navigate("/select", {
        state: {
          gameId: nextEntry.game_id,
          gameTitle: nextEntry.game_title,
          gameNumber: nextEntry.game_number,
          totalGames: nextEntry.total_games,
          allCompleted: nextEntry.all_completed,
        },
      });
      return;
    }
    navigate("/");
  };

  if (gameOver) {
    return (
      <div className={styles.page} dir="rtl" lang="ar">
        <div className={styles.backdrop} aria-hidden="true">
          <div className={styles.grain} />
        </div>
        <Spotlight />
        <div className={styles.resultScreen}>
          <motion.div
            className={styles.resultCard}
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className={styles.resultTrophy}>🏆</span>
            <h1 className={styles.resultTitle}>مبروووووك</h1>
            <p className={styles.resultSub}>يستاهل الكاس من شااااله</p>
            <span className={styles.resultWinner}>
              {winner === -1 ? "تعادل!" : winner === 0 ? team1 : team2}
            </span>
            <div className={styles.resultScores}>
              <div className={`${styles.resultTeam} ${winner === 0 ? styles.resultTeamWin : ""}`}>
                <span className={styles.resultTeamName}>{team1}</span>
                <span className={styles.resultTeamScore}>{toArabicNum(scores[0])}</span>
              </div>
              <span className={styles.resultVs}>-</span>
              <div className={`${styles.resultTeam} ${winner === 1 ? styles.resultTeamWin : ""}`}>
                <span className={styles.resultTeamName}>{team2}</span>
                <span className={styles.resultTeamScore}>{toArabicNum(scores[1])}</span>
              </div>
            </div>
            <button className={styles.resultHomeBtn} onClick={() => navigate("/")}>
              الرئيسية
            </button>
            {nextEntry?.action === "new" && nextEntry.game_id && !nextEntry.all_completed && (
              <button className={styles.resultNextBtn} onClick={startNextGame}>
                اللعبة التالية
              </button>
            )}
            {nextEntry?.all_completed && (
              <button className={styles.resultNextBtn} onClick={startNextGame}>
                العب من جديد
              </button>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page} dir="rtl" lang="ar">
      <div className={styles.backdrop} aria-hidden="true">
        <div className={styles.grain} />
      </div>
      <Spotlight />

      <div className={styles.content}>
        {gameTitle && (
          <div className={styles.gameBadge}>{gameTitle}</div>
        )}
        {/* Scoreboard */}
        <div className={styles.scoreboard}>
          <div className={`${styles.teamCard} ${turn === 0 ? styles.teamActive : ""}`}>
            <span className={styles.teamLabel}>{team1}</span>
            <span className={styles.teamScore}>{toArabicNum(scores[0])}</span>
            <div className={styles.teamPowerUps}>
              {powerUps.map((pu) => (
                <span
                  key={pu.id}
                  className={`${styles.puBtn} ${usedPowerUps[0].includes(pu.id) ? styles.puUsed : ""}`}
                  title={pu.title}
                >
                  {pu.icon}
                </span>
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
                <span
                  key={pu.id}
                  className={`${styles.puBtn} ${usedPowerUps[1].includes(pu.id) ? styles.puUsed : ""}`}
                  title={pu.title}
                >
                  {pu.icon}
                </span>
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
                const isFlash = flashCell === key;
                const result = results[key];

                return (
                  <button
                    key={key}
                    type="button"
                    className={`${styles.cell} ${isAnswered && result === "correct" ? styles.cellDoneCorrect : ""} ${isAnswered && result === "wrong" ? styles.cellDoneWrong : ""} ${isActive ? styles.cellActive : ""} ${isFlash && result === "correct" ? styles.cellCorrect : ""} ${isFlash && result === "wrong" ? styles.cellWrong : ""}`}
                    onClick={(e) => { e.preventDefault(); handleCellClick(cat.id, pts, q); }}
                    disabled={isAnswered || isFlash}
                  >
                    {toArabicNum(pts)}
                  </button>
                );
              }),
            ),
          )}
        </div>

        {/* Question overlay */}
        <AnimatePresence>
          {activeCell && (() => {
            const [cId, pts, qIdx] = activeCell.split("-").map(Number);
            const q = getQuestion(cId, pts, qIdx);
            return (
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
                  {(phase === "question" || phase === "steal") ? (
                    <>
                      <span className={styles.qTeamTurn}>{turn === 0 ? team1 : team2}</span>
                      <span className={`${styles.qPoints} ${activePowerUps.includes("double") ? styles.qPointsDouble : ""}`}>
                        {activePowerUps.includes("double") ? toArabicNum(pts * 2) : toArabicNum(pts)} نقطة
                      </span>
                      <div className={`${styles.qTimer} ${timer <= 10 && !activePowerUps.includes("call") ? styles.qTimerUrgent : ""} ${activePowerUps.includes("call") ? styles.qTimerPaused : ""}`}>
                        {activePowerUps.includes("call") ? "⏸" : toArabicNum(timer)}
                      </div>
                      <p className={styles.qText}>{q?.text || "لا يوجد سؤال"}</p>
                      <AnimatePresence>
                        {activePowerUps.includes("multi") && q?.options && (
                          <motion.div
                            className={styles.qOptions}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                          >
                            {q.options.map((opt, i) => (
                              <motion.span
                                key={i}
                                className={styles.qOption}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08, duration: 0.3 }}
                              >
                                {opt}
                              </motion.span>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {activePowerUps.length === 0 && (
                        <div className={styles.qPowerUps}>
                          {powerUps.map((pu) => {
                            const used = usedPowerUps[turn].includes(pu.id);
                            return (
                              <button
                                key={pu.id}
                                type="button"
                                className={`${styles.qPuBtn} ${used ? styles.qPuUsed : ""}`}
                                onClick={() => usePowerUp(pu.id)}
                                disabled={used}
                              >
                                <span>{pu.icon}</span>
                                <span>{pu.title}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <button
                        type="button"
                        className={styles.qNextBtn}
                        onClick={handleNext}
                      >
                        التالي
                      </button>
                    </>
                  ) : (
                    <>
                      <span className={styles.qWhoTitle}>مين جاوب؟</span>
                      {revealedAnswer && (
                        <div className={styles.qRevealedAnswer}>
                          <span className={styles.qRevealedLabel}>الإجابة</span>
                          <span className={styles.qRevealedText}>{revealedAnswer}</span>
                        </div>
                      )}
                      <div className={styles.qTeamPick}>
                        <button
                          type="button"
                          className={styles.qTeamBtn}
                          onClick={() => handleTeamAnswered(0)}
                        >
                          {team1}
                        </button>
                        <button
                          type="button"
                          className={styles.qTeamBtn}
                          onClick={() => handleTeamAnswered(1)}
                        >
                          {team2}
                        </button>
                      </div>
                      <button
                        type="button"
                        className={styles.qNoOneBtn}
                        onClick={handleNoOneAnswered}
                      >
                        ما أحد جاوب
                      </button>
                    </>
                  )}
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>
    </div>
  );
}
