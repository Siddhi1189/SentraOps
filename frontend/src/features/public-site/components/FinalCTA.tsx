import { Link } from 'react-router-dom';
import styles from './FinalCTA.module.css';

export interface FinalCTAProps {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  primaryText?: string;
  primaryLink?: string;
  secondaryText?: string;
  secondaryLink?: string;
  isFullWidth?: boolean;
}

export function FinalCTA({
  title = 'Ready to Simplify Your Operations?',
  subtitle = 'Join 500+ engineering teams already monitoring smarter with SentraOps.',
  primaryText = 'Start 14-Day Free Trial',
  primaryLink = '/register',
  isFullWidth = false,
}: FinalCTAProps) {
  if (isFullWidth) {
    return (
      <section className={styles.fullSection}>
        <div className={styles.container}>
          <div className={styles.fullCard}>
            <h2 className={styles.fullTitle}>{title}</h2>
            <p className={styles.fullSubtitle}>{subtitle}</p>
            <div className={styles.ctaRow}>
              <Link to={primaryLink} className={styles.amberBtn}>
                <span>{primaryText}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>
            <span className={styles.microcopy}>No credit card required.</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.subtitle}>{subtitle}</p>

      <Link to={primaryLink} className={styles.amberBtn}>
        <span>{primaryText}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </Link>

      <span className={styles.microcopy}>No credit card required.</span>
    </div>
  );
}
