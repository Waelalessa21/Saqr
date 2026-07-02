import { motion } from "framer-motion";
import styles from "./FinalCTA.module.css";

const reveal = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const footerReveal = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function FinalCTA({ onStart, starting = false }: { onStart: () => void; starting?: boolean }) {
  const year = "٢٠٢٦";

  return (
    <section className={styles.section} id="start">
      <motion.div
        className={styles.cta}
        variants={reveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
      >
        <div className={styles.ctaGlow} aria-hidden="true" />
        <span className={styles.kicker}>ابدأ الآن</span>
        <h2 className={styles.title}>
          جاهزين تلعبون؟
          <br />
          لعبتك الأولى علينا
        </h2>
        <p className={styles.sub}>
          أنشئ مواجهتك خلال دقائق، اجمع أصحابك، ودع التحدّي يبدأ.
        </p>
        <button onClick={onStart} className={styles.btn} disabled={starting}>
          {starting ? "جاري التحميل..." : "ابدأ اللعبة ⚽"}
          <span className={styles.glow} aria-hidden="true" />
        </button>
      </motion.div>

      <motion.footer
        className={styles.footer}
        variants={footerReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
      >
        <div className={styles.footerInner}>
          <span className={styles.brand}>صقر</span>

          <span className={styles.made}>
            صنع بحب من المملكة للعالم
            <span className={styles.heart} aria-hidden="true">💚</span>
          </span>

          <span className={styles.copy}>
            © {year} — جميع الحقوق محفوظة لـ صقر
          </span>
        </div>
      </motion.footer>
    </section>
  );
}
