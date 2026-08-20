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
                <span>Start 14-Day Free Trial</span>
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

            {/* Social Proof Row */}
            <div className={styles.socialProofRow}>
              <div className={styles.avatarStack}>
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces"
                  alt="Customer"
                  className={styles.stackAvatar}
                />
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=faces"
                  alt="Customer"
                  className={styles.stackAvatar}
                />
                <img
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=64&h=64&fit=crop&crop=faces"
                  alt="Customer"
                  className={styles.stackAvatar}
                />
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop&crop=faces"
                  alt="Customer"
                  className={styles.stackAvatar}
                />
              </div>

              <div className={styles.ratingInfo}>
                <div className={styles.starsRow}>
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#E8A33D" stroke="#E8A33D">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                  <span className={styles.scoreText}>4.9/5</span>
                </div>
                <div className={styles.trustText}>Trusted by engineering teams worldwide</div>
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
