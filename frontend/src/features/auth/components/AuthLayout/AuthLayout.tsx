import type React from 'react';
import { Link } from 'react-router-dom';
import styles from './AuthLayout.module.css';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className={styles.container}>
      {/* Top-Left Back to Home Navigation */}
      <Link to="/" className={styles.backHomeLink} aria-label="Back to SentraOps homepage">
        &larr; Back to Home
      </Link>

      {/* Organic background decorative SVG curves */}
      <svg className={styles.bgDecorTopRight} viewBox="0 0 400 400" fill="none" aria-hidden="true">
        <path d="M400 0C300 80 250 200 400 400" stroke="#EAE2D4" strokeWidth="1.5" />
        <path d="M400 60C320 130 280 230 400 350" stroke="#EAE2D4" strokeWidth="1" strokeDasharray="4 4" />
      </svg>
      <svg className={styles.bgDecorBottomLeft} viewBox="0 0 400 400" fill="none" aria-hidden="true">
        <path d="M0 400C100 320 150 200 0 0" stroke="#EAE2D4" strokeWidth="1.5" />
        <path d="M0 340C80 270 120 170 0 50" stroke="#EAE2D4" strokeWidth="1" strokeDasharray="4 4" />
      </svg>

      <div className={styles.authWrapper}>
        {/* Top Trust Pill Badge */}
        <div className={styles.trustBadge}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E8A33D" strokeWidth="2.2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          <span>
            Trusted by <strong className={styles.amberText}>500+</strong> engineering teams worldwide
          </span>
        </div>

        {/* Centered White Card */}
        <div className={styles.authCard}>
          {/* Logo & Tagline */}
          <div className={styles.cardBrandHeader}>
            <Link to="/" className={styles.brandLogo} aria-label="SentraOps Home">
              <svg className={styles.logoSvg} viewBox="0 0 36 36" fill="none" aria-hidden="true">
                <path d="M18 3L32 10.5V25.5L18 33L4 25.5V10.5L18 3Z" fill="#0B1F2A" stroke="#E8A33D" strokeWidth="1.5" />
                <path d="M18 3L32 10.5L18 18L4 10.5L18 3Z" fill="#E8A33D" fillOpacity="0.9" />
                <path d="M18 18V33L32 25.5V10.5L18 18Z" fill="#132E3E" />
                <path d="M18 18V33L4 25.5V10.5L18 18Z" fill="#0B1F2A" />
                <path d="M18 12L25 15.5M18 12L11 15.5M18 12V6.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
                <circle cx="18" cy="18" r="2" fill="#E8A33D" />
              </svg>
              <div className={styles.wordmark}>
                <span className={styles.brandNavy}>Sentra</span>
                <span className={styles.brandAmber}>Ops</span>
              </div>
            </Link>
            <span className={styles.tagline}>Monitor. Detect. Recover.</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
