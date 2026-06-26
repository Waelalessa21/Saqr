import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { categories as allCategories } from "../../data/categories";
import { Spotlight } from "../landing/Spotlight";
import styles from "./TeamNames.module.css";

const aids = [
  { id: "multi", icon: "🃏", title: "خيارات متعددة", desc: "تحوّل السؤال إلى اختيار من متعدد" },
  { id: "double", icon: "✨", title: "نقاط مضاعفة", desc: "ضاعف نقاطك إذا جاوبت صح" },
  { id: "call", icon: "📞", title: "اتصل بصديق", desc: "اطلب مساعدة صديق خارج اللعبة" },
];

export function TeamNames() {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedCategories: number[] = location.state?.categories ?? [];

  const [team1, setTeam1] = useState<string>(location.state?.team1 ?? "");
  const [team2, setTeam2] = useState<string>(location.state?.team2 ?? "");
  const [expanded, setExpanded] = useState<string | null>(null);

  const canStart = team1.trim().length > 0 && team2.trim().length > 0;

  const onlyArabic = (value: string) =>
    value.replace(/[^؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿\s]/g, "");

  const toggleAid = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  return (
    <div className={styles.page} dir="rtl" lang="ar">
      <div className={styles.backdrop} aria-hidden="true">
        <div className={styles.grain} />
      </div>

      <Spotlight />

      <motion.div
        className={styles.content}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className={styles.header}>
          <Link to="/select" state={{ categories: selectedCategories }} className={styles.backLink}>
            → الرجوع
          </Link>
          <h1 className={styles.title}>أسماء الفرق</h1>
          <p className={styles.subtitle}>سمّ فريقك وخلّ المواجهة تبدأ</p>

          {selectedCategories.length > 0 && (
            <div className={styles.chips}>
              {selectedCategories.map((id) => {
                const cat = allCategories.find((c) => c.id === id);
                if (!cat) return null;
                return (
                  <span key={id} className={styles.chip}>
                    {cat.icon} {cat.title}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="team1">
              <span className={styles.labelIcon}>🟢</span>
              الفريق الأول
            </label>
            <input
              id="team1"
              className={styles.input}
              type="text"
              placeholder="مثال: الصقور"
              value={team1}
              onChange={(e) => setTeam1(onlyArabic(e.target.value))}
              maxLength={20}
              autoComplete="off"
              dir="rtl"
              lang="ar"
            />
            {canStart && (
              <div className={styles.aidsRow}>
                <TeamAids expanded={expanded} onToggle={toggleAid} prefix="t1" />
              </div>
            )}
          </div>

          <span className={styles.vs}>ضد</span>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="team2">
              <span className={styles.labelIcon}>⚪</span>
              الفريق الثاني
            </label>
            <input
              id="team2"
              className={styles.input}
              type="text"
              placeholder="مثال: النسور"
              value={team2}
              onChange={(e) => setTeam2(onlyArabic(e.target.value))}
              maxLength={20}
              autoComplete="off"
              dir="rtl"
              lang="ar"
            />
            {canStart && (
              <div className={styles.aidsRow}>
                <TeamAids expanded={expanded} onToggle={toggleAid} prefix="t2" />
              </div>
            )}
          </div>

          {canStart && (
            <div className={`${styles.footer} ${styles.fadeIn}`}>
              <button
                className={styles.startBtn}
                onClick={() => navigate("/game", {
                  state: { categories: selectedCategories, team1: team1.trim(), team2: team2.trim() },
                })}
              >
                ابدأ المواجهة
                <span className={styles.btnGlow} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function TeamAids({
  expanded,
  onToggle,
  prefix,
}: {
  expanded: string | null;
  onToggle: (id: string) => void;
  prefix: string;
}) {
  return (
    <div className={styles.aidsList}>
        {aids.map((aid) => {
          const key = `${prefix}-${aid.id}`;
          const isOpen = expanded === key;

          return (
            <div
              key={key}
              className={`${styles.aid} ${isOpen ? styles.aidOpen : ""}`}
              onClick={() => onToggle(key)}
            >
              <span className={styles.aidIcon}>{aid.icon}</span>
              <span className={styles.aidText}>{aid.title}</span>
            </div>
          );
        })}
    </div>
  );
}
