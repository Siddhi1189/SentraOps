import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './PublicNavbar.module.css';

export interface PublicNavItem {
  label: string;
  path: string;
}

export const NAV_LINKS: PublicNavItem[] = [
  { label: 'Docs', path: '/docs' },
  { label: 'Status', path: '/status/acme-corp' },
];

export function PublicNavbar() {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname, location.hash]);

  return (
    <header className={styles.header}>
      <div className={styles.navContainer}>
        {/* Brand Logo & Wordmark */}
        <Link to="/" className={styles.brand} aria-label="SentraOps Home">
          <div className={styles.logoMarkWrap}>
            <svg
              className={styles.logoSvg}
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Isometric Cube Shape */}
              <path
                d="M18 3L32 10.5V25.5L18 33L4 25.5V10.5L18 3Z"
                fill="#0B1F2A"
                stroke="#E8A33D"
                strokeWidth="1.5"
              />
              <path
                d="M18 3L32 10.5L18 18L4 10.5L18 3Z"
                fill="#E8A33D"
                fillOpacity="0.85"
              />
              <path
                d="M18 18V33L32 25.5V10.5L18 18Z"
                fill="#132E3E"
              />
              <path
                d="M18 18V33L4 25.5V10.5L18 18Z"
                fill="#0B1F2A"
              />
              {/* Internal geometric circuitry */}
              <path
                d="M18 12L25 15.5M18 12L11 15.5M18 12V6.5"
                stroke="#FFFFFF"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <circle cx="18" cy="18" r="2" fill="#E8A33D" />
            </svg>
          </div>
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>SentraOps</span>
            <span className={styles.brandSubtitle}>Monitor. Detect. Recover.</span>
          </div>
        </Link>

        {/* Center Desktop Navigation Links */}
        <nav className={styles.desktopNav} aria-label="Main Navigation">
          {NAV_LINKS.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.label}
                to={item.path}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Auth / Action CTAs */}
        <div className={styles.authGroup}>
          <Link to="/login" className={styles.loginBtn}>
            Log In
          </Link>
          <Link to="/register" className={styles.trialBtn}>
            Get started
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          className={styles.mobileToggle}
          onClick={() => setIsMobileOpen(true)}
          aria-label="Open Navigation Menu"
          aria-expanded={isMobileOpen}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className={styles.mobileOverlay} onClick={() => setIsMobileOpen(false)}>
          <div
            className={styles.mobileSheet}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Mobile Navigation"
          >
            <div className={styles.mobileHeader}>
              <div className={styles.brand}>
                <div className={styles.logoMarkWrap}>
                  <svg className={styles.logoSvg} viewBox="0 0 36 36" fill="none">
                    <path d="M18 3L32 10.5V25.5L18 33L4 25.5V10.5L18 3Z" fill="#0B1F2A" stroke="#E8A33D" strokeWidth="1.5" />
                    <path d="M18 3L32 10.5L18 18L4 10.5L18 3Z" fill="#E8A33D" fillOpacity="0.85" />
                    <path d="M18 18V33L32 25.5V10.5L18 18Z" fill="#132E3E" />
                    <path d="M18 18V33L4 25.5V10.5L18 18Z" fill="#0B1F2A" />
                  </svg>
                </div>
                <div className={styles.brandText}>
                  <span className={styles.brandTitle}>SentraOps</span>
                </div>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsMobileOpen(false)}
                aria-label="Close menu"
              >
                &times;
              </button>
            </div>

            <nav className={styles.mobileNavList}>
              <Link to="/docs" className={styles.mobileNavLink} onClick={() => setIsMobileOpen(false)}>
                Docs
              </Link>
              <Link to="/status/acme-corp" className={styles.mobileNavLink} onClick={() => setIsMobileOpen(false)}>
                Status
              </Link>
            </nav>

            <div className={styles.mobileAuthActions}>
              <Link to="/login" className={styles.mobileLoginBtn} onClick={() => setIsMobileOpen(false)}>
                Log In
              </Link>
              <Link to="/register" className={styles.mobileTrialBtn} onClick={() => setIsMobileOpen(false)}>
                Get started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
