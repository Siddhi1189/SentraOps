import { PublicNavbar } from '../../features/public-site/components/PublicNavbar';
import { PageHeaderHero } from '../../features/public-site/components/PageHeaderHero';
import { FinalCTA } from '../../features/public-site/components/FinalCTA';
import { PublicFooter } from '../../features/public-site/components/PublicFooter';
import styles from './PublicAnalyticsPage.module.css';

export function PublicAnalyticsPage() {
  return (
    <div className={styles.pageWrapper}>
      <PublicNavbar />
      <main className={styles.mainContent}>
        <PageHeaderHero
          variant="white"
          eyebrow="RELIABILITY ANALYTICS &amp; TELEMETRY"
          title="Actionable reliability analytics on uptime, MTTR, and failure modes."
          subtitle="Understand operational health with high-precision time-windowed metrics across services, severity tiers, and historical SLA compliance."
        />

        {/* Section 1: Telemetry Dashboard Visual */}
        <section className={styles.telemetrySection}>
          <div className={styles.telemetryContainer}>
            <div>
              <div className={styles.eyebrow}>
                <span className={styles.eyebrowDot} />
                <span>ROLLING INSPECTION WINDOWS</span>
              </div>
              <h2 className={styles.sectionTitle}>
                Analyze team velocity across 7, 30, and 90-day timeframes.
              </h2>
              <p className={styles.sectionDescription}>
                Measure Mean Time to Detect (MTTD) and Mean Time to Resolve (MTTR) with rolling inspection filters. Identify whether recent architecture updates or incident playbooks improved recovery curves.
              </p>
              <div className={styles.bulletList}>
                <div className={styles.bulletItem}>
                  <span className={styles.bulletDot} />
                  <span>Configurable rolling inspection windows (7-Day, 30-Day, 90-Day)</span>
                </div>
                <div className={styles.bulletItem}>
                  <span className={styles.bulletDot} />
                  <span>Severity tier distribution breakdown (Critical, High, Medium, Low)</span>
                </div>
                <div className={styles.bulletItem}>
                  <span className={styles.bulletDot} />
                  <span>Historical SLA compliance computation and audit-ready exports</span>
                </div>
              </div>
            </div>

            {/* Rebuilt Telemetry Metrics Visual Mockup */}
            <div className={styles.mockupCard}>
              <div className={styles.mockupHeader}>
                <span className={styles.mockupTitle}>Reliability Metrics &bull; 30-Day Window</span>
                <span className={styles.scopeBadge}>FLEET SCOPE</span>
              </div>
              <div className={styles.statsGrid}>
                <div className={styles.statBox}>
                  <div className={styles.statLabel}>Mean Time to Detect</div>
                  <div className={styles.statValue}>2.4 mins</div>
                  <div className={styles.statTag}>✓ Fast Probe Alarms</div>
                </div>

                <div className={styles.statBox}>
                  <div className={styles.statLabel}>Mean Time to Resolve</div>
                  <div className={styles.statValue}>14.8 mins</div>
                  <div className={styles.statTarget}>SLA Target: &lt; 30 mins</div>
                </div>
              </div>

              <div className={styles.ratioCard}>
                <div className={styles.ratioHeader}>
                  <span className={styles.ratioLabel}>Service Availability Ratio</span>
                  <span className={styles.ratioValue}>99.98%</span>
                </div>
                <div className={styles.progressBarTrack}>
                  <div className={styles.progressBarFill} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: 3-Column Metric Capabilities */}
        <section className={styles.pillarsSection}>
          <div className={styles.pillarsContainer}>
            <div className={styles.pillarsGrid}>
              <div className={styles.pillarCard}>
                <span className={styles.pillarNumber}>01 / VELOCITY</span>
                <h3 className={styles.pillarTitle}>MTTD &amp; MTTR Metrics</h3>
                <p className={styles.pillarDesc}>
                  Quantify Mean Time to Detect and Mean Time to Resolve over rolling inspection windows to measure responder effectiveness.
                </p>
              </div>

              <div className={styles.pillarCard}>
                <span className={styles.pillarNumber}>02 / PATTERNS</span>
                <h3 className={styles.pillarTitle}>Severity Distribution</h3>
                <p className={styles.pillarDesc}>
                  Identify recurring failure patterns by analyzing incident volume across Low, Medium, High, and Critical tiers.
                </p>
              </div>

              <div className={styles.pillarCard}>
                <span className={styles.pillarNumber}>03 / AUDITABILITY</span>
                <h3 className={styles.pillarTitle}>Historical SLA Compliance</h3>
                <p className={styles.pillarDesc}>
                  Verify contractual uptime commitments and generate audit-ready availability reports for leadership and enterprise customers.
                </p>
              </div>
            </div>
          </div>
        </section>

        <FinalCTA
          eyebrow="RELIABILITY TELEMETRY"
          title="Gain precision MTTD, MTTR, and SLA reliability metrics."
          subtitle="Inspect velocity trends across 7, 30, and 90-day rolling windows with automated severity breakdown and SLA compliance tracking."
          primaryText="Start Telemetry Trial"
          primaryLink="/register"
          secondaryText="Explore Platform Overview"
          secondaryLink="/platform"
        />
      </main>
      <PublicFooter />
    </div>
  );
}
