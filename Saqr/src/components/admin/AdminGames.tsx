import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { getToken } from "../../api";
import { Spotlight } from "../landing/Spotlight";
import { UserBar } from "../shared/UserBar";
import { ConfirmModal } from "../shared/ConfirmModal";
import styles from "./AdminGames.module.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

type Game = {
  id: number;
  title: string;
  status: string;
  question_count: number;
};

type Suggestion = {
  id: number;
  user_id: number;
  user_name: string | null;
  text: string;
  created_at: string | null;
};

const formatDate = (iso: string | null) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ar-SA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function AdminGames() {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const token = getToken();

  const fetchGames = async () => {
    const res = await fetch(`${API}/api/admin/games`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setGames(await res.json());
  };

  const fetchSuggestions = async () => {
    const res = await fetch(`${API}/api/suggestions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setSuggestions(await res.json());
  };

  useEffect(() => {
    fetchGames();
    fetchSuggestions();
  }, []);

  const createGame = async () => {
    if (!title.trim() || loading) return;
    setLoading(true);
    const res = await fetch(`${API}/api/admin/games`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: title.trim() }),
    });
    if (res.ok) {
      const game = await res.json();
      setTitle("");
      navigate(`/admin/games/${game.id}`);
    }
    setLoading(false);
  };

  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);

  const confirmDelete = async () => {
    if (!gameToDelete) return;
    await fetch(`${API}/api/admin/games/${gameToDelete.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setGameToDelete(null);
    fetchGames();
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
          <Link to="/" className={styles.backLink}>→ الرئيسية</Link>
          <h1 className={styles.title}>إدارة الألعاب</h1>
          <p className={styles.subtitle}>أنشئ لعبة جديدة، أضف الأسئلة، ثم انشرها</p>
        </div>

        <form
          className={styles.createRow}
          onSubmit={(e) => { e.preventDefault(); createGame(); }}
        >
          <input
            className={styles.createInput}
            placeholder="اسم اللعبة الجديدة..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button
            className={styles.createBtn}
            type="submit"
            disabled={!title.trim() || loading}
          >
            إنشاء
          </button>
        </form>

        <div className={styles.list}>
          {games.length === 0 && (
            <p className={styles.empty}>لا توجد ألعاب بعد</p>
          )}
          {games.map((g) => (
            <div
              key={g.id}
              className={styles.card}
              onClick={() => navigate(`/admin/games/${g.id}`)}
            >
              <div className={styles.cardInfo}>
                <h3 className={styles.cardTitle}>{g.title}</h3>
                <p className={styles.cardMeta}>{g.question_count} سؤال</p>
              </div>
              <span className={`${styles.badge} ${g.status === "published" ? styles.badgePublished : styles.badgeDraft}`}>
                {g.status === "published" ? "منشورة" : "مسودة"}
              </span>
              <button
                className={styles.deleteBtn}
                onClick={(e) => { e.stopPropagation(); setGameToDelete(g); }}
                title="حذف"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <section className={styles.suggestionsSection}>
          <div className={styles.suggestionsHead}>
            <h2 className={styles.suggestionsTitle}>اقتراحات الفئات</h2>
            <span className={styles.suggestionsCount}>{suggestions.length}</span>
          </div>
          {suggestions.length === 0 ? (
            <p className={styles.suggestionsEmpty}>لا توجد اقتراحات بعد</p>
          ) : (
            <div className={styles.suggestionsList}>
              {suggestions.map((s) => (
                <article key={s.id} className={styles.suggestionCard}>
                  <p className={styles.suggestionText}>{s.text}</p>
                  <div className={styles.suggestionMeta}>
                    <span>{s.user_name || "مستخدم"}</span>
                    <span className={styles.suggestionDot}>•</span>
                    <span>{formatDate(s.created_at)}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <AnimatePresence>
        {gameToDelete && (
          <ConfirmModal
            title="حذف اللعبة؟"
            message={`سيتم حذف «${gameToDelete.title}» وجميع أسئلتها (${gameToDelete.question_count} سؤال) نهائيًا.`}
            onConfirm={confirmDelete}
            onCancel={() => setGameToDelete(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
