import { Link } from 'react-router-dom';
import { DashboardPreviewCard } from './DashboardPreviewCard';
import styles from './ProductHero.module.css';

export function ProductHero() {
  return (
    <section className={styles.heroSection}>
      <div className={styles.heroContainer}>
        <div className={styles.heroGrid}>
          {/* Left Column: Value Proposition & Copy */}
          <div className={styles.leftCol}>
            {/* Pill Badge */}
            <div className={styles.badgePill}>
              <span className={styles.badgeDot} />
              <span className={styles.badgeText}>ENGINEERING OPERATIONS MONITORING PLATFORM</span>
            </div>

            {/* 3-Line Headline with Highlighted Word */}
            <h1 className={styles.headline}>
              Monitor. Detect.
              <br />
              Respond. Recover.
              <br />
              <span className={styles.headlineAccent}>Automatically.</span>
            </h1>

            {/* Supporting Subheading */}
            <p className={styles.subheading}>
              SentraOps continuously monitors your critical HTTP services, detects issues in real-time, and automates incident management from alert to resolution.
            </p>

            {/* CTA Buttons */}
            <div className={styles.ctaGroup}>
              <Link to="/register" className={styles.primaryBtn}>
                <span>Get started</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <a href="#how-it-works" className={styles.secondaryBtn}>
                View Live Demo
              </a>
            </div>

            {/* 4 Feature Checkmark Badges */}
            <div className={styles.featurePillsRow}>
              <div className={styles.featurePill}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Real-time Monitoring</span>
              </div>
              <div className={styles.featurePill}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Smart Alerts</span>
              </div>
              <div className={styles.featurePill}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Auto Recovery</span>
              </div>
              <div className={styles.featurePill}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Built for Reliability</span>
              </div>
            </div>
          </div>

          {/* Right Column: Dashboard Preview Browser Frame */}
          <div className={styles.rightCol}>
            <DashboardPreviewCard />
          </div>
        </div>
      </div>
    </section>
  );
}
