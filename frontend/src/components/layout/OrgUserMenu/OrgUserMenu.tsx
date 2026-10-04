import { useState, useRef, useEffect } from 'react';
import { useSession } from '../../../app/providers/SessionProvider';
import styles from './OrgUserMenu.module.css';

export function OrgUserMenu() {
  const { user, organization, logout } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('sentraops_theme') as 'light' | 'dark' | null;
      if (saved === 'light' || saved === 'dark') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {}
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      localStorage.setItem('sentraops_theme', nextTheme);
    } catch {}
  };

  const orgName = organization?.name || 'My Organization';
  const userName = user?.name || 'User';
  const userRole = user?.role || 'viewer';
  const initialLetter = userName.charAt(0).toUpperCase();

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  // Close popover on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeMenu();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    closeMenu();
    await logout();
  };

  const roleClassMap: Record<string, string> = {
    owner: styles.roleBadgeOwner,
    admin: styles.roleBadgeAdmin,
    viewer: styles.roleBadgeViewer,
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User and organization menu"
      >
        <div className={styles.avatarCircle}>
          <span className={styles.avatarFallback}>{initialLetter}</span>
        </div>
        <div className={styles.triggerDetails}>
          <span className={styles.userName}>{userName}</span>
          <span className={styles.orgName}>{orgName}</span>
        </div>
        <svg className={styles.chevron} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.menuPopover} role="menu" aria-label="User account actions">
          <div className={styles.headerInfo}>
            <span className={styles.headerOrg}>{orgName}</span>
            <span className={styles.headerUser}>{userName}</span>
            <div className={styles.headerMeta}>
              <span className={`${styles.roleBadge} ${roleClassMap[userRole] || styles.roleBadgeViewer}`}>
                {userRole}
              </span>
            </div>
          </div>

          <div
            style={{
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--color-border)',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              Theme
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 8px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-surface-hover)',
                color: 'var(--color-text-primary)',
                cursor: 'pointer',
              }}
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>

          <button
            type="button"
            className={styles.logoutButton}
            onClick={handleLogout}
            role="menuitem"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
