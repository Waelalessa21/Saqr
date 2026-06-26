import { categories } from "../../data/categories";
import { Reveal, RevealGroup, RevealItem } from "./Reveal";
import styles from "./Categories.module.css";

const stats = [
  { value: "١٢", label: "فئة في البنك" },
  { value: "٦", label: "فئات لكل لعبة" },
  { value: "٣٦", label: "سؤال في كل مواجهة" },
  { value: "٣", label: "وسائل مساعدة لكل فريق" },
];

export function Categories() {
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
      </div>
    </section>
  );
}
