import { useEffect } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "framer-motion";
import styles from "./Spotlight.module.css";

export function Spotlight() {
  const x = useMotionValue(50);
  const y = useMotionValue(18);
  const spring = { stiffness: 50, damping: 22, mass: 0.6 };
  const sx = useSpring(x, spring);
  const sy = useSpring(y, spring);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) return;

    const onMove = (e: PointerEvent) => {
      x.set((e.clientX / window.innerWidth) * 100);
      y.set((e.clientY / window.innerHeight) * 100);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [x, y]);

  const light = useMotionTemplate`radial-gradient(48vw 48vw at ${sx}% ${sy}%, rgba(0, 188, 109, 0.05), rgba(0, 188, 109, 0.015) 32%, transparent 58%)`;

  return (
    <div className={styles.layer} aria-hidden="true">
      <motion.div className={styles.light} style={{ background: light }} />
      <div className={styles.flood} />
      <div className={styles.vignette} />
    </div>
  );
}
