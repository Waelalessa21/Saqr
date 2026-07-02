import { useEffect, useRef, useState } from "react";
import {
  easeIn,
  motion,
  useMotionTemplate,
  useScroll,
  useTime,
  useTransform,
} from "framer-motion";
import type { MotionValue } from "framer-motion";
import styles from "./Hero.module.css";

import hero from "../../assets/assets/hero/hero.png";
import hero1 from "../../assets/assets/hero/hero1.jpeg";
import hero2 from "../../assets/assets/hero/hero2.jpg";
import hero3 from "../../assets/assets/hero/hero3.jpg";
import hero4 from "../../assets/assets/hero/hero4.jpg";
import hero5 from "../../assets/assets/hero/hero5.jpg";
import hero6 from "../../assets/assets/hero/hero6.jpg";

const ORBIT_IMAGES = [
  { src: hero, alt: "كرة القدم" },
  { src: hero1, alt: "ملعب كرة قدم" },
  { src: hero2, alt: "أجواء المباراة" },
  { src: hero3, alt: "لحظة من الملعب" },
  { src: hero4, alt: "كرة القدم السعودية" },
  { src: hero5, alt: "أجواء المدرجات" },
  { src: hero6, alt: "مشهد رياضي" },
];

type OrbitImageProps = {
  image: { src: string; alt: string };
  angle: number;
  spin: MotionValue<number>;
  radius: MotionValue<number>;
  opacity: MotionValue<number>;
  scale: MotionValue<number>;
};

const RADIUS_X = 1.45;
const RADIUS_Y = 0.78;

function OrbitImage({ image, angle, spin, radius, opacity, scale }: OrbitImageProps) {
  const x = useTransform(
    () => radius.get() * RADIUS_X * Math.cos(((angle + spin.get()) * Math.PI) / 180),
  );
  const y = useTransform(
    () => radius.get() * RADIUS_Y * Math.sin(((angle + spin.get()) * Math.PI) / 180),
  );
  const transform = useMotionTemplate`translate(-50%, -50%) translateX(${x}px) translateY(${y}px) scale(${scale})`;

  return (
    <motion.div className={styles.orbitItem} style={{ transform, opacity }}>
      <div className={styles.imgCircle}>
        <img src={image.src} alt={image.alt} loading="lazy" draggable={false} />
        <span className={styles.imgTint} aria-hidden="true" />
      </div>
    </motion.div>
  );
}

export function Hero({ onStart, starting = false }: { onStart: () => void; starting?: boolean }) {
  const ref = useRef<HTMLElement>(null);

  const [reduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const [orbit, setOrbit] = useState({ radius: 250, count: 8 });
  useEffect(() => {
    const calc = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const mobile = vw < 640;
      const raw = mobile ? vw * 0.44 : Math.min(vw, vh) * 0.44;
      const radius = Math.round(Math.max(165, Math.min(raw, mobile ? 235 : 450)));
      setOrbit({ radius, count: mobile ? 6 : 8 });
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const time = useTime();

  const idleSpin = useTransform(time, (t) => (reduced ? 0 : (t / 38000) * 360));
  const scrollSpin = useTransform(
    scrollYProgress,
    [0, 1],
    reduced ? [0, 0] : [0, 260],
    { ease: easeIn },
  );
  const spin = useTransform(() => idleSpin.get() + scrollSpin.get());

  const radius = useTransform(
    scrollYProgress,
    [0, 1],
    reduced ? [orbit.radius, orbit.radius] : [orbit.radius, orbit.radius * 2.4],
  );
  const imgOpacity = useTransform(
    scrollYProgress,
    [0, 0.55, 0.9],
    reduced ? [1, 1, 1] : [1, 0.65, 0],
  );
  const imgScale = useTransform(
    scrollYProgress,
    [0, 1],
    reduced ? [1, 1] : [1, 1.5],
  );

  const textOpacity = useTransform(
    scrollYProgress,
    [0, 0.5],
    reduced ? [1, 1] : [1, 0],
  );
  const textY = useTransform(
    scrollYProgress,
    [0, 0.5],
    reduced ? [0, 0] : [0, -40],
  );

  const images = ORBIT_IMAGES.slice(0, orbit.count);

  return (
    <section ref={ref} className={styles.hero}>
      <div className={styles.centerGlow} aria-hidden="true" />

      <div className={styles.orbit} aria-hidden="true">
        {images.map((image, i) => (
          <OrbitImage
            key={image.src}
            image={image}
            angle={(360 / images.length) * i}
            spin={spin}
            radius={radius}
            opacity={imgOpacity}
            scale={imgScale}
          />
        ))}
      </div>

      <motion.div
        className={styles.center}
        style={{ opacity: textOpacity, y: textY }}
      >
        <motion.h1
          className={styles.logo}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          صقر
        </motion.h1>

        <motion.p
          className={styles.tagline}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          العب و بنجهز لك <span style={{ color: 'var(--accent)' }}>كاس الذهب</span> 🏆
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
          <button onClick={onStart} className={styles.cta} disabled={starting}>
            {starting ? "جاري التحميل..." : "ابدأ اللعبة ⚽"}
            <span className={styles.ctaGlow} aria-hidden="true" />
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
}
