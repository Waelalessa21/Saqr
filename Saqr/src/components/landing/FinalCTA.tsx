import { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import styles from "./FinalCTA.module.css";

import ctaVideo from "../../assets/vid/goal.mp4";

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
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = useState(true);
  const [reduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const videoScale = useTransform(
    scrollYProgress,
    [0, 1],
    reduced ? [1, 1] : [1, 1.45],
  );

  useEffect(() => {
    if (reduced) {
      setShowVideo(false);
      return;
    }

    videoRef.current?.play().catch(() => {});
  }, [reduced]);

  return (
    <section ref={sectionRef} className={styles.section} id="start">
      <motion.div
        className={styles.cta}
        variants={reveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
      >
        {showVideo && (
          <motion.div
            className={styles.bgMedia}
            style={{ scale: videoScale }}
            aria-hidden="true"
          >
            <video
              ref={videoRef}
              className={styles.bgVideo}
              src={ctaVideo}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
          </motion.div>
        )}
        <div className={styles.videoOverlay} aria-hidden="true" />
        <div className={styles.ctaGlow} aria-hidden="true" />

        <div className={styles.ctaContent}>
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
        </div>
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
