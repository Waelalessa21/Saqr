import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import styles from "./AuthModal.module.css";

type Mode = "login" | "signup";

const REFERRAL_OPTIONS = [
  "تويتر / X",
  "انستقرام",
  "سناب شات",
  "تيك توك",
  "صديق",
  "أخرى",
];

export function AuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");
  const [passConfirm, setPassConfirm] = useState("");
  const [referral, setReferral] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setError("");
    setEmail("");
    setName("");
    setPass("");
    setPassConfirm("");
    setReferral("");
  };

  const switchMode = (m: Mode) => {
    reset();
    setMode(m);
  };

  const handleSignup = async () => {
    if (!name.trim()) return setError("أدخل اسمك");
    if (!email.trim()) return setError("أدخل بريدك الإلكتروني");
    if (pass.length < 6) return setError("كلمة المرور يجب أن تكون ٦ أحرف على الأقل");
    if (pass !== passConfirm) return setError("كلمة المرور غير متطابقة");

    if (!auth || !db) return setError("Firebase غير مُعد");
    setLoading(true);
    setError("");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name.trim() });
      await setDoc(doc(db, "users", cred.user.uid), {
        name: name.trim(),
        email,
        referral: referral || null,
        createdAt: new Date().toISOString(),
      });
      onClose();
    } catch (e: any) {
      if (e.code === "auth/email-already-in-use") setError("البريد مستخدم بالفعل");
      else if (e.code === "auth/invalid-email") setError("بريد إلكتروني غير صالح");
      else setError("حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim()) return setError("أدخل بريدك الإلكتروني");
    if (!pass) return setError("أدخل كلمة المرور");
    if (!auth) return setError("Firebase غير مُعد");

    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      onClose();
    } catch (e: any) {
      if (e.code === "auth/user-not-found" || e.code === "auth/wrong-password" || e.code === "auth/invalid-credential")
        setError("البريد أو كلمة المرور غير صحيحة");
      else if (e.code === "auth/invalid-email") setError("بريد إلكتروني غير صالح");
      else setError("حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup") handleSignup();
    else handleLogin();
  };

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.modal}
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
        lang="ar"
      >
        <button className={styles.close} onClick={onClose}>✕</button>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${mode === "login" ? styles.tabActive : ""}`}
            onClick={() => switchMode("login")}
          >
            تسجيل دخول
          </button>
          <button
            className={`${styles.tab} ${mode === "signup" ? styles.tabActive : ""}`}
            onClick={() => switchMode("signup")}
          >
            حساب جديد
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              className={styles.fields}
              initial={{ opacity: 0, x: mode === "signup" ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === "signup" ? -20 : 20 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {mode === "signup" && (
                <input
                  className={styles.input}
                  type="text"
                  placeholder="الاسم"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              )}

              <input
                className={styles.input}
                type="email"
                placeholder="البريد الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                dir="ltr"
              />

              <input
                className={styles.input}
                type="password"
                placeholder="كلمة المرور"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />

              {mode === "signup" && (
                <>
                  <input
                    className={styles.input}
                    type="password"
                    placeholder="تأكيد كلمة المرور"
                    value={passConfirm}
                    onChange={(e) => setPassConfirm(e.target.value)}
                    autoComplete="new-password"
                  />

                  <select
                    className={styles.select}
                    value={referral}
                    onChange={(e) => setReferral(e.target.value)}
                  >
                    <option value="">كيف سمعت عنّا؟</option>
                    {REFERRAL_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {error && <p className={styles.error}>{error}</p>}

          <button
            className={styles.submit}
            type="submit"
            disabled={loading}
          >
            {loading
              ? "..."
              : mode === "login"
                ? "دخول"
                : "إنشاء حساب"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
