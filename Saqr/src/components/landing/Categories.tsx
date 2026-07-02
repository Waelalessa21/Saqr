import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { categories } from "../../data/categories";
import { getToken } from "../../api";
import { Reveal, RevealGroup, RevealItem } from "./Reveal";
import styles from "./Categories.module.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const stats = [
  { value: "١٢", label: "فئة في البنك" },
  { value: "٦", label: "فئات لكل لعبة" },
  { value: "٣٦", label: "سؤال في كل مواجهة" },
  { value: "٣", label: "وسائل مساعدة لكل فريق" },
];

export function Categories() {
  const loggedIn = Boolean(getToken());
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [submittedText, setSubmittedText] = useState("");
  const [error, setError] = useState("");

  const submitSuggestion = async () => {
    if (!suggestion.trim() || sending) return;
    setSending(true);
    setError("");
    const text = suggestion.trim();
    try {
      const res = await fetch(`${API}/api/suggestions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error();
      setSubmittedText(text);
      setSent(true);
      setSuggestion("");
      setTimeout(() => {
        setShowSuggest(false);
        setSent(false);
        setSubmittedText("");
      }, 2600);
    } catch {
      setError("حدث خطأ، حاول مرة أخرى");
    }
    setSending(false);
  };

  return (
    <section className={styles.section} id="how-it-works">
      <div className={styles.wrap}>
        <Reveal className={styles.head} direction="up">
          <span className={styles.kicker}>كيف تلعب</span>
          <h2 className={styles.title}>لعبة واحدة، لا نهاية من التحدّي</h2>
          <p className={styles.lead}>
            اختر ٦ فئات من بين ١٢، وواجه خصمك عبر ٣٦ سؤالًا تتصاعد صعوبتها.
            استخدم وسائلك المساعدة بذكاء، ودع الأفضل يفوز.
          </p>
        </Reveal>

        <RevealGroup className={styles.stats} stagger={0.1}>
          {stats.map((s) => (
            <RevealItem key={s.label} className={styles.stat}>
              <span className={styles.statValue}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal className={styles.gridHead} direction="up">
          <h3 className={styles.gridTitle}>الفئات</h3>
          <span className={styles.gridNote}>اختر ٦ منها لكل لعبة</span>
        </Reveal>

        <RevealGroup className={styles.grid} stagger={0.07}>
          {categories.map((cat) => (
            <RevealItem key={cat.id}>
              <article className={styles.card}>
                <div className={styles.cardGlow} aria-hidden="true" />
                <span className={styles.cardIcon} aria-hidden="true">
                  {cat.icon}
                </span>
                <h4 className={styles.cardTitle}>{cat.title}</h4>
                <p className={styles.cardBlurb}>{cat.blurb}</p>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>

        {loggedIn && (
          <Reveal className={styles.suggestWrap} direction="up">
            <button className={styles.suggestBtn} onClick={() => setShowSuggest(true)}>
              اقتراح فئة
            </button>
          </Reveal>
        )}
      </div>

      <AnimatePresence>
        {showSuggest && (
          <motion.div
            className={styles.suggestOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowSuggest(false)}
          >
            <motion.div
              className={styles.suggestModal}
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              dir="rtl"
              lang="ar"
            >
              {sent ? (
                <motion.div
                  className={styles.suggestSent}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25 }}
                >
                  <motion.span
                    className={styles.suggestSentRing}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1.4, opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    aria-hidden="true"
                  />
                  <motion.span
                    className={styles.suggestSentIcon}
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 320, damping: 16, delay: 0.05 }}
                  >
                    ✓
                  </motion.span>
                  <motion.p
                    className={styles.suggestSentText}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.35 }}
                  >
                    وصلنا اقتراحك، شكرًا لك!
                  </motion.p>
                  {submittedText && (
                    <motion.p
                      className={styles.suggestSentQuote}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.28, duration: 0.35 }}
                    >
                      «{submittedText}»
                    </motion.p>
                  )}
                </motion.div>
              ) : (
                <>
                  <h3 className={styles.suggestTitle}>اقترح فئة جديدة</h3>
                  <p className={styles.suggestSub}>وش الفئة اللي تتمنى تلعبها؟</p>
                  <form
                    className={styles.suggestForm}
                    onSubmit={(e) => { e.preventDefault(); submitSuggestion(); }}
                  >
                    <input
                      className={styles.suggestInput}
                      placeholder="مثال: كأس الملك، منتخبات الخليج..."
                      value={suggestion}
                      onChange={(e) => setSuggestion(e.target.value)}
                      maxLength={200}
                      autoFocus
                    />
                    {error && <p className={styles.suggestError}>{error}</p>}
                    <button
                      className={styles.suggestSubmit}
                      type="submit"
                      disabled={!suggestion.trim() || sending}
                    >
                      {sending ? "جاري الإرسال..." : "أرسل الاقتراح"}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
