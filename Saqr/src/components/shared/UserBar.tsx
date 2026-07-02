import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getUser, getToken, clearAuth, apiGetMe, saveUser } from "../../api";
import styles from "./UserBar.module.css";

export function UserBar() {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const cached = getUser();
    const token = getToken();
    if (cached) {
      setUserName(cached.name);
      setIsAdmin(cached.role === "admin");
    } else if (token) {
      apiGetMe(token)
        .then((u) => { saveUser(u); setUserName(u.name); setIsAdmin(u.role === "admin"); })
        .catch(() => clearAuth());
    }
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const handleLogout = () => {
    clearAuth();
    setUserName(null);
    setIsAdmin(false);
    setMenuOpen(false);
    navigate("/");
  };

  if (!userName) return null;

  const initial = userName.trim().charAt(0) || "ص";

  return (
    <>
      <div className={styles.avatarWrap} ref={menuRef}>
        <button
          type="button"
          className={styles.avatarBtn}
          aria-label="قائمة الحساب"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {initial}
        </button>
        {menuOpen && (
          <div className={styles.menu} role="menu">
            <Link
              to="/profile"
              className={styles.menuItem}
              role="menuitem"
              onClick={() => setMenuOpen(false)}
            >
              <svg className={styles.menuIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>الملف الشخصي</span>
            </Link>
            <button
              type="button"
              className={styles.menuItem}
              role="menuitem"
              onClick={handleLogout}
            >
              <svg className={styles.menuIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>تسجيل خروج</span>
            </button>
          </div>
        )}
      </div>

      <div className={styles.userBar}>
        <span className={styles.greeting}>حياك يالصقر،</span>
        {!isAdmin && (
          <>
            {" "}
            <span className={styles.userName}>{userName}</span>
          </>
        )}
        {isAdmin && (
          <Link to="/admin" className={styles.adminLink}>الإدارة</Link>
        )}
      </div>
    </>
  );
}
