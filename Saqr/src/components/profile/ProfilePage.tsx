import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { getToken, getUser, saveUser, apiGetMe, clearAuth } from "../../api";
import { categories as allCategories } from "../../data/categories";
import { Spotlight } from "../landing/Spotlight";
import { UserBar } from "../shared/UserBar";
import styles from "./ProfilePage.module.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

type Tab = "account" | "games";

type GameResult = {
  id: number;
  game_id: number;
  team1: string;
  team2: string;
  score1: number;
  score2: number;
  winner: string | null;
  categories: number[] | null;
  played_at: string | null;
};

const toArabicNum = (n: number) =>
  n === 0 ? "٠" : String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]);

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "—";
  }
};

export function ProfilePage() {
  const [tab, setTab] = useState<Tab>("account");
  const [user, setUser] = useState(getUser());
  const [results, setResults] = useState<GameResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    apiGetMe(token)
      .then((u) => { saveUser(u); setUser(u); })
      .catch(() => clearAuth());
    fetch(`${API}/api/games/my/results`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setResults(data))
      .catch(() => {})
      .finally(() => setLoadingResults(false));
  }, []);

  return (
    <div className={styles.page} dir="rtl" lang="ar">
      <div className={styles.backdrop} aria-hidden="true">
        <div className={styles.grain} />
      </div>
      <Spotlight />
      <UserBar />

      <div className={styles.content}>
        <div className={styles.header}>
          <Link to="/" className={styles.backLink}>→ الرئيسية</Link>
          <h1 className={styles.title}>الملف الشخصي</h1>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === "account" ? styles.tabActive : ""}`}
            onClick={() => setTab("account")}
          >
            معلومات الحساب
          </button>
          <button
            className={`${styles.tab} ${tab === "games" ? styles.tabActive : ""}`}
            onClick={() => setTab("games")}
          >
            ألعابي
          </button>
        </div>

        {tab === "account" ? (
          <motion.div
            key="account"
            className={styles.card}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>الاسم</span>
              <span className={styles.infoValue}>{user?.name ?? "—"}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>البريد الإلكتروني</span>
              <span className={styles.infoValue} dir="ltr">{user?.email ?? "—"}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>تاريخ الانضمام</span>
              <span className={styles.infoValue}>{formatDate(user?.created_at)}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>عدد الألعاب</span>
              <span className={styles.infoValue}>{toArabicNum(results.length)}</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="games"
            className={styles.gamesList}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {loadingResults && <p className={styles.empty}>جاري التحميل...</p>}
            {!loadingResults && results.length === 0 && (
              <p className={styles.empty}>ما لعبت أي لعبة بعد — يلا ابدأ أول مواجهة!</p>
            )}
            {results.map((r) => {
              const cats = (r.categories ?? [])
                .map((id) => allCategories.find((c) => c.id === id))
                .filter(Boolean);
              return (
                <div key={r.id} className={styles.gameCard}>
                  <div className={styles.gameTop}>
                    <span className={styles.gameDate}>{formatDate(r.played_at)}</span>
                    {r.winner ? (
                      <span className={styles.gameWinner}>🏆 {r.winner}</span>
                    ) : (
                      <span className={styles.gameDraw}>تعادل</span>
                    )}
                  </div>
                  <div className={styles.gameScores}>
                    <div className={`${styles.gameTeam} ${r.winner === r.team1 ? styles.gameTeamWin : ""}`}>
                      <span className={styles.gameTeamName}>{r.team1}</span>
                      <span className={styles.gameTeamScore}>{toArabicNum(r.score1)}</span>
                    </div>
                    <span className={styles.gameVs}>ضد</span>
                    <div className={`${styles.gameTeam} ${r.winner === r.team2 ? styles.gameTeamWin : ""}`}>
                      <span className={styles.gameTeamName}>{r.team2}</span>
                      <span className={styles.gameTeamScore}>{toArabicNum(r.score2)}</span>
                    </div>
                  </div>
                  {cats.length > 0 && (
                    <div className={styles.gameCats}>
                      {cats.map((c) => (
                        <span key={c!.id} className={styles.gameCat}>
                          {c!.icon} {c!.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
