import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getToken } from "../../api";
import { categories } from "../../data/categories";
import { Spotlight } from "../landing/Spotlight";
import { UserBar } from "../shared/UserBar";
import styles from "./AdminGameDetail.module.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const POINTS = [200, 400, 600];

const ARABIC_NUMS: Record<string, string> = { "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9" };
const fromArabicNum = (s: string) => parseInt(s.replace(/[٠-٩]/g, (d) => ARABIC_NUMS[d] || d));

const CAT_MAP: Record<string, number> = {};
categories.forEach((c) => {
  CAT_MAP[c.title] = c.id;
  const short = c.title.replace(/\s*\(.*\)/, "");
  if (short !== c.title) CAT_MAP[short] = c.id;
});

function findCategoryId(name: string): number | null {
  const clean = name.trim();
  if (CAT_MAP[clean]) return CAT_MAP[clean];
  for (const [key, id] of Object.entries(CAT_MAP)) {
    if (key.includes(clean) || clean.includes(key)) return id;
  }
  return null;
}

type ParsedQuestion = { category_id: number; points: number; text: string; answer: string; options: string[] | null };

function parseQuestions(text: string): ParsedQuestion[] {
  const lines = text.split("\n");
  const results: ParsedQuestion[] = [];
  let current: { category_id: number; points: number; text: string; options: string[]; answer: string } | null = null;
  let awaitingText = false;

  const pushCurrent = () => {
    if (current && current.text) {
      results.push({
        category_id: current.category_id,
        points: current.points,
        text: current.text,
        answer: current.answer,
        options: current.options.length > 0 ? current.options : null,
      });
    }
  };

  for (const raw of lines) {
    const line = raw.trim().replace(/^\*\*|\*\*$/g, "");
    if (!line) continue;

    // match header: [Category] — ٢٠٠  (with or without question text on same line)
    const qMatch = line.match(/^\[(.+?)\]\s*[—–-]\s*([٠-٩0-9]+)\s*(.*)/);
    if (qMatch) {
      pushCurrent();
      const catId = findCategoryId(qMatch[1]);
      if (!catId) { current = null; continue; }
      const inlineText = qMatch[3]?.trim() || "";
      current = {
        category_id: catId,
        points: fromArabicNum(qMatch[2]),
        text: inlineText,
        options: [],
        answer: "",
      };
      awaitingText = !inlineText;
      continue;
    }

    // match option: أ) Option text ✅  or  - أ) / * أ) Option text ✅
    const optMatch = line.match(/^(?:[-*]\s*)?[أ-ي]\)\s*(.+)/);
    if (optMatch && current) {
      awaitingText = false;
      const optText = optMatch[1].replace(/✅/g, "").trim();
      current.options.push(optText);
      if (line.includes("✅")) {
        current.answer = optText;
      }
      continue;
    }

    // if we're awaiting question text (it was on a separate line)
    if (awaitingText && current && !current.text) {
      current.text = line;
      awaitingText = false;
    }
  }

  pushCurrent();
  return results;
}

type Question = {
  id: number;
  game_id: number;
  category_id: number;
  points: number;
  text: string;
  answer: string;
  options: string[] | null;
};

type GameDetail = {
  id: number;
  title: string;
  status: string;
  questions: Question[];
};

export function AdminGameDetail() {
  const { gameId } = useParams();
  const token = getToken();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchGame = async () => {
    const res = await fetch(`${API}/api/admin/games/${gameId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setGame(await res.json());
  };

  useEffect(() => {
    fetchGame();
  }, [gameId]);

  const publish = async () => {
    const res = await fetch(`${API}/api/admin/games/${gameId}/publish`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) fetchGame();
    else {
      const data = await res.json().catch(() => null);
      setError(data?.detail || "خطأ");
    }
  };

  const unpublish = async () => {
    const res = await fetch(`${API}/api/admin/games/${gameId}/unpublish`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) fetchGame();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const text = await file.text();
      const questions = parseQuestions(text);
      if (questions.length === 0) {
        setError("لم يتم العثور على أسئلة في الملف");
        setUploading(false);
        return;
      }
      const res = await fetch(`${API}/api/admin/games/${gameId}/questions/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(questions),
      });
      if (res.ok) {
        fetchGame();
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.detail || "خطأ في رفع الأسئلة");
      }
    } catch {
      setError("خطأ في قراءة الملف");
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const updateQuestion = async (qId: number, body: { text?: string; answer?: string; options?: string[] }) => {
    const res = await fetch(`${API}/api/admin/games/${gameId}/questions/${qId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    if (res.ok) fetchGame();
  };

  const deleteQuestion = async (qId: number) => {
    await fetch(`${API}/api/admin/games/${gameId}/questions/${qId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchGame();
  };

  if (!game) return <div className={styles.page}><p className={styles.loading}>جاري التحميل...</p></div>;

  const isPublished = game.status === "published";

  return (
    <div className={styles.page} dir="rtl" lang="ar">
      <div className={styles.backdrop} aria-hidden="true">
        <div className={styles.grain} />
      </div>
      <Spotlight />
      <UserBar />

      <div className={styles.content}>
        <div className={styles.header}>
          <Link to="/admin" className={styles.backLink}>→ الألعاب</Link>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{game.title}</h1>
            <span className={`${styles.badge} ${isPublished ? styles.badgePublished : styles.badgeDraft}`}>
              {isPublished ? "منشورة" : "مسودة"}
            </span>
          </div>
          <div className={styles.actions}>
            {isPublished ? (
              <button className={styles.unpublishBtn} onClick={unpublish}>إلغاء النشر</button>
            ) : (
              <>
                <button className={styles.publishBtn} onClick={publish}>نشر اللعبة</button>
                <button
                  className={styles.uploadBtn}
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? "جاري الرفع..." : "رفع ملف أسئلة"}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  hidden
                />
              </>
            )}
          </div>
          {error && <p className={styles.error}>{error}</p>}
        </div>

        {categories.map((cat) => {
          const catQuestions = game.questions.filter((q) => q.category_id === cat.id);
          return (
            <div key={cat.id} className={styles.catSection}>
              <div className={styles.catHeader}>
                <span className={styles.catIcon}>{cat.icon}</span>
                <h2 className={styles.catTitle}>{cat.title}</h2>
                <span className={styles.catCount}>{catQuestions.length} سؤال</span>
              </div>

              {POINTS.map((pts) => {
                const ptsQuestions = catQuestions.filter((q) => q.points === pts);
                return (
                  <div key={pts} className={styles.pointsGroup}>
                    <div className={styles.pointsLabel}>{pts} نقطة</div>
                    <div className={styles.questionsList}>
                      {ptsQuestions.map((q) => (
                        <QuestionCard
                          key={q.id}
                          q={q}
                          readOnly={isPublished}
                          onUpdate={(body) => updateQuestion(q.id, body)}
                          onDelete={() => deleteQuestion(q.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuestionCard({
  q,
  readOnly,
  onUpdate,
  onDelete,
}: {
  q: Question;
  readOnly: boolean;
  onUpdate: (body: { text?: string; answer?: string; options?: string[] }) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(q.text);
  const [answer, setAnswer] = useState(q.answer);
  const [options, setOptions] = useState<string[]>(q.options ?? []);
  const [newOption, setNewOption] = useState("");

  const save = () => {
    onUpdate({ text, answer, options: options.length > 0 ? options : undefined });
    setEditing(false);
  };

  const cancel = () => {
    setText(q.text);
    setAnswer(q.answer);
    setOptions(q.options ?? []);
    setNewOption("");
    setEditing(false);
  };

  const removeOption = (i: number) => setOptions((prev) => prev.filter((_, idx) => idx !== i));

  const addOption = () => {
    if (!newOption.trim()) return;
    setOptions((prev) => [...prev, newOption.trim()]);
    setNewOption("");
  };

  if (editing) {
    return (
      <div className={styles.questionCard}>
        <div className={styles.editForm}>
          <div className={styles.editField}>
            <label className={styles.editLabel}>السؤال</label>
            <input className={styles.editInput} value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <div className={styles.editField}>
            <label className={styles.editLabel}>الإجابة</label>
            <input className={styles.editInput} value={answer} onChange={(e) => setAnswer(e.target.value)} />
          </div>
          <div className={styles.editField}>
            <label className={styles.editLabel}>الخيارات</label>
            <div className={styles.editOptions}>
              {options.map((opt, i) => (
                <div key={i} className={styles.editOptionRow}>
                  <input
                    className={styles.editInput}
                    value={opt}
                    onChange={(e) => setOptions((prev) => prev.map((o, idx) => idx === i ? e.target.value : o))}
                  />
                  <button className={styles.qDeleteBtn} onClick={() => removeOption(i)}>✕</button>
                </div>
              ))}
              <div className={styles.editOptionRow}>
                <input
                  className={styles.editInput}
                  placeholder="خيار جديد..."
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOption(); } }}
                />
                <button className={styles.editAddOptBtn} onClick={addOption} disabled={!newOption.trim()}>+</button>
              </div>
            </div>
          </div>
          <div className={styles.editActions}>
            <button className={styles.editSaveBtn} onClick={save}>حفظ</button>
            <button className={styles.editCancelBtn} onClick={cancel}>إلغاء</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.questionCard} onClick={() => !readOnly && setEditing(true)} style={{ cursor: readOnly ? "default" : "pointer" }}>
      <div className={styles.questionBody}>
        <span className={styles.questionText}>{q.text}</span>
        {q.options && (
          <div className={styles.optionsList}>
            {q.options.map((opt, i) => (
              <span key={i} className={`${styles.option} ${opt === q.answer ? styles.optionCorrect : ""}`}>
                {opt}
              </span>
            ))}
          </div>
        )}
      </div>
      <span className={styles.questionAnswer}>{q.answer}</span>
      {!readOnly && (
        <button className={styles.qDeleteBtn} onClick={(e) => { e.stopPropagation(); onDelete(); }}>✕</button>
      )}
    </div>
  );
}
