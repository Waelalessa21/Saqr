import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getToken } from "../../api";
import styles from "./SuggestCategory.module.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function SuggestCategory() {
  const loggedIn = Boolean(getToken());
  const [show, setShow] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  if (!loggedIn) return null;

  const submit = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/suggestions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ text: text.trim() }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
      setText("");
      setTimeout(() => {
        setShow(false);
        setSent(false);
      }, 1600);
    } catch {
      setError("حدث خطأ، حاول مرة أخرى");
    }
    setSending(false);
  };

  return (
    <>
      <button className={styles.suggestBtn} onClick={() => setShow(true)}>
        اقتراح فئة
      </button>

      <AnimatePresence>
        {show && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShow(false)}
          >
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              dir="rtl"
              lang="ar"
            >
              {sent ? (
                <div className={styles.sent}>
                  <span className={styles.sentIcon}>✓</span>
                  <p className={styles.sentText}>وصلنا اقتراحك، شكرًا لك!</p>
                </div>
              ) : (
                <>
                  <h3 className={styles.title}>اقترح فئة جديدة</h3>
                  <p className={styles.sub}>وش الفئة اللي تتمنى تلعبها؟</p>
                  <form
                    className={styles.form}
                    onSubmit={(e) => { e.preventDefault(); submit(); }}
                  >
                    <input
                      className={styles.input}
                      placeholder="مثال: كأس الملك، منتخبات الخليج..."
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      maxLength={200}
                      autoFocus
                    />
                    {error && <p className={styles.error}>{error}</p>}
                    <button
                      className={styles.submit}
                      type="submit"
                      disabled={!text.trim() || sending}
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
    </>
  );
}
