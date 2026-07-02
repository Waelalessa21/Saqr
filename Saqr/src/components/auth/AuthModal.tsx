import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { apiSignup, apiLogin, apiVerifyOtp, apiResendOtp, saveToken, saveUser } from "../../api";
import styles from "./AuthModal.module.css";

type Mode = "login" | "signup";
type Step = "form" | "otp";

const REFERRAL_OPTIONS = [
  "تويتر / X",
  "انستقرام",
  "سناب شات",
  "تيك توك",
  "صديق",
  "أخرى",
];

const OTP_LENGTH = 6;

export type AuthUser = { name: string; role: string };

export function AuthModal({ onClose }: { onClose: (user?: AuthUser) => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");
  const [passConfirm, setPassConfirm] = useState("");
  const [referral, setReferral] = useState("");
  const [otp, setOtp] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const loginReady = email.trim().length > 0 && pass.length >= 6;
  const signupReady =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    pass.length >= 6 &&
    passConfirm.length >= 6 &&
    pass === passConfirm &&
    referral.length > 0;
  const formReady = mode === "login" ? loginReady : signupReady;

  const reset = () => {
    setError("");
    setEmail("");
    setName("");
    setPass("");
    setPassConfirm("");
    setReferral("");
    setOtp("");
    setPendingEmail("");
    setStep("form");
  };

  const switchMode = (m: Mode) => {
    reset();
    setMode(m);
  };

  const finishAuth = (user: AuthUser) => {
    setSuccess(true);
    setTimeout(() => onClose(user), 1100);
  };

  const handleSignup = async () => {
    if (!name.trim()) return setError("أدخل اسمك");
    if (!email.trim()) return setError("أدخل بريدك الإلكتروني");
    if (pass.length < 6) return setError("كلمة المرور يجب أن تكون ٦ أحرف على الأقل");
    if (pass !== passConfirm) return setError("كلمة المرور غير متطابقة");

    setLoading(true);
    setError("");
    try {
      const data = await apiSignup({
        name: name.trim(),
        email,
        password: pass,
        referral: referral || null,
      });
      setPendingEmail(data.email);
      setStep("otp");
      setOtp("");
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (otp.trim().length !== 6) return setError("أدخل رمز التحقق المكوّن من ٦ أرقام");

    setLoading(true);
    setError("");
    try {
      const data = await apiVerifyOtp({ email: pendingEmail, code: otp.trim() });
      saveToken(data.token);
      saveUser(data.user);
      setLoading(false);
      finishAuth({ name: data.user.name, role: data.user.role });
    } catch (e: any) {
      setLoading(false);
      setError(e.message);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingEmail || loading) return;
    setLoading(true);
    setError("");
    try {
      await apiResendOtp(pendingEmail);
      setOtp("");
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!email.trim()) return setError("أدخل بريدك الإلكتروني");
    if (!pass) return setError("أدخل كلمة المرور");

    setLoading(true);
    setError("");
    try {
      const data = await apiLogin({ email, password: pass });
      saveToken(data.token);
      saveUser(data.user);
      setLoading(false);
      finishAuth({ name: data.user.name, role: data.user.role });
    } catch (e: any) {
      setLoading(false);
      if (e.message === "verify_email") {
        setPendingEmail(email);
        setStep("otp");
        setOtp("");
        setError("فعّل بريدك برمز التحقق المرسل");
        return;
      }
      setError(e.message);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "otp") {
      handleVerifyOtp();
      return;
    }
    if (mode === "signup") handleSignup();
    else handleLogin();
  };

  const maskEmail = (value: string) => {
    const [local, domain] = value.split("@");
    if (!domain) return value;
    const visible = local.slice(0, 2);
    return `${visible}***@${domain}`;
  };

  const otpDigits = Array.from({ length: OTP_LENGTH }, (_, i) => otp[i] ?? "");

  const setOtpDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = otpDigits.map((d, i) => (i === index ? digit : d));
    setOtp(next.join("").trimEnd());
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    setOtp(pasted);
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    otpRefs.current[focusIndex]?.focus();
  };

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={() => onClose()}
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
        {success ? (
          <motion.div
            className={styles.successView}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.span
              className={styles.successCheck}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
            >
              ✓
            </motion.span>
            <span className={styles.successText}>حياك يالصقر</span>
          </motion.div>
        ) : step === "otp" ? (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.otpHead}>
              <h3 className={styles.otpTitle}>تحقق من بريدك</h3>
              <p className={styles.otpSub}>
                أدخل رمز التحقق المرسل إلى
                <span className={styles.otpEmail} dir="ltr">{maskEmail(pendingEmail)}</span>
              </p>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>رمز التحقق</label>
              <div className={styles.otpPins} dir="ltr">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpRefs.current[index] = el; }}
                    className={styles.otpPin}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => setOtpDigit(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    autoFocus={index === 0}
                    aria-label={`رمز ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button className={styles.submit} type="submit" disabled={loading || otp.length !== OTP_LENGTH}>
              {loading ? <span className={styles.spinner} /> : "تحقق"}
            </button>

            <button
              type="button"
              className={styles.resendBtn}
              onClick={handleResendOtp}
              disabled={loading}
            >
              إعادة إرسال الرمز
            </button>
          </form>
        ) : (
          <>
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
              <div className={styles.fields}>
                <div className={`${styles.signupOnly} ${mode === "signup" ? styles.signupShow : ""}`}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>الاسم</label>
                    <input
                      className={styles.input}
                      type="text"
                      placeholder="محمد العلي"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      tabIndex={mode === "signup" ? 0 : -1}
                    />
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>البريد الإلكتروني</label>
                  <input
                    className={styles.input}
                    type="email"
                    placeholder="mohammed@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    dir="ltr"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.label}>كلمة المرور</label>
                  <input
                    className={styles.input}
                    type="password"
                    placeholder="*******"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  />
                </div>

                <div className={`${styles.signupOnly} ${mode === "signup" ? styles.signupShow : ""}`}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>تأكيد كلمة المرور</label>
                    <input
                      className={styles.input}
                      type="password"
                      placeholder="*******"
                      value={passConfirm}
                      onChange={(e) => setPassConfirm(e.target.value)}
                      autoComplete="new-password"
                      tabIndex={mode === "signup" ? 0 : -1}
                    />
                  </div>
                </div>

                <div className={`${styles.signupOnly} ${mode === "signup" ? styles.signupShow : ""}`}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>كيف سمعت عنّا؟</label>
                    <select
                      className={styles.select}
                      value={referral}
                      onChange={(e) => setReferral(e.target.value)}
                      tabIndex={mode === "signup" ? 0 : -1}
                    >
                      <option value="">اختر...</option>
                      {REFERRAL_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <button className={styles.submit} type="submit" disabled={loading || !formReady}>
                {loading
                  ? <span className={styles.spinner} />
                  : mode === "login"
                    ? "دخول"
                    : "إنشاء حساب"}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
