import { motion } from "framer-motion";
import styles from "./ConfirmModal.module.css";

export function ConfirmModal({
  title,
  message,
  confirmLabel = "حذف",
  cancelLabel = "إلغاء",
  onConfirm,
  onCancel,
}: {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onCancel}
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
        role="alertdialog"
        aria-label={title}
      >
        <span className={styles.icon}>🗑️</span>
        <h2 className={styles.title}>{title}</h2>
        {message && <p className={styles.message}>{message}</p>}
        <div className={styles.actions}>
          <button className={styles.confirmBtn} onClick={onConfirm} autoFocus>
            {confirmLabel}
          </button>
          <button className={styles.cancelBtn} onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
