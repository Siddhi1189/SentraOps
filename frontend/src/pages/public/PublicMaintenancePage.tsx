import { PublicNavbar } from '../../features/public-site/components/PublicNavbar';
import { PageHeaderHero } from '../../features/public-site/components/PageHeaderHero';
import { FinalCTA } from '../../features/public-site/components/FinalCTA';
import { PublicFooter } from '../../features/public-site/components/PublicFooter';
import styles from './PublicMaintenancePage.module.css';

export function PublicMaintenancePage() {
  return (
    <div className={styles.pageWrapper}>
      <PublicNavbar />
      <main className={styles.mainContent}>
        <PageHeaderHero
          variant="white"
          eyebrow="SCHEDULED MAINTENANCE &amp; SUPPRESSION"
          title="Plan infrastructure upgrades and patch windows with zero operational confusion."
          subtitle="Coordinate maintenance schedules across affected services, suppress false-positive alerts automatically, and keep customers informed well in advance."
        />

        {/* Section 1: Time-Bound Orchestration */}
        <section className={styles.schedulesSection}>
          <div className={styles.schedulesContainer}>
            <div>
              <div className={styles.eyebrow}>
                <span className={styles.eyebrowDot} />
                <span>COORDINATED SCHEDULES</span>
              </div>
              <h2 className={styles.sectionTitle}>
                Precise time windows with automated state management.
              </h2>
              <p className={styles.sectionDescription}>
                Define explicit start and end times with time zone alignment. SentraOps automatically transitions affected components to Maintenance state at the scheduled second and restores them upon completion.
              </p>
              <div className={styles.bulletList}>
                <div className={styles.bulletItem}>
                  <span className={styles.bulletDot} />
                  <span>Automated service health transition into Maintenance during active window</span>
                </div>
                <div className={styles.bulletItem}>
                  <span className={styles.bulletDot} />
                  <span>Suppression of false-positive pager alarms for affected components</span>
                </div>
                <div className={styles.bulletItem}>
                  <span className={styles.bulletDot} />
                  <span>Broadcast to public customer status pages well ahead of window start</span>
                </div>
              </div>
            </div>

            {/* Rebuilt Maintenance Mockup Card */}
            <div className={styles.mockupCard}>
              <div className={styles.mockupHeader}>
                <span className={styles.mockupTitle}>Maintenance Orchestration</span>
                <span className={styles.statusChipScheduled}>
                  ● SCHEDULED
                </span>
              </div>
              <div className={styles.mockupBody}>
                <div className={styles.maintenanceItem}>
                  <div className={styles.itemHeading}>Database Kernel Patch &amp; Failover</div>
                  <div className={styles.itemSchedule}>
                    Scheduled: Sunday, 02:00 – 04:00 UTC (120 mins)
                  </div>
                  <div className={styles.itemFooter}>
                    <span className={styles.affectedService}>Affected: Production DB Cluster</span>
                    <span className={styles.suppressionBadge}>✓ Alarm Suppression Set</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: 3-Pillar Value Grid */}
        <section className={styles.pillarsSection}>
          <div className={styles.pillarsContainer}>
            <div className={styles.pillarsGrid}>
              <div className={styles.pillarCard}>
                <span className={styles.pillarNumber}>01 / TIMING</span>
                <h3 className={styles.pillarTitle}>Time-Bound Windows</h3>
                <p className={styles.pillarDesc}>
                  Define explicit start and end times with time zone alignment. The system automatically transitions services to Maintenance state during the window.
                </p>
              </div>

              <div className={styles.pillarCard}>
                <span className={styles.pillarNumber}>02 / RESILIENCE</span>
                <h3 className={styles.pillarTitle}>Alert Suppression</h3>
                <p className={styles.pillarDesc}>
                  Prevent noisy incident pages and pager alerts while planned database migrations, cluster failovers, or kernel updates are actively underway.
                </p>
              </div>

              <div className={styles.pillarCard}>
                <span className={styles.pillarNumber}>03 / VISIBILITY</span>
                <h3 className={styles.pillarTitle}>Public Status Sync</h3>
                <p className={styles.pillarDesc}>
                  Broadcast planned maintenance notices directly to your organization&apos;s public status page so stakeholders are never caught off guard.
                </p>
              </div>
            </div>
          </div>
        </section>

        <FinalCTA
          eyebrow="MAINTENANCE ORCHESTRATION"
          title="Automate scheduled maintenance with intelligent alert suppression."
          subtitle="Schedule maintenance windows with precision, auto-transition service health, and eliminate false-positive on-call alerts."
          primaryText="Plan Maintenance Window"
          primaryLink="/register"
          secondaryText="View Reliability Analytics"
          secondaryLink="/analytics"
        />
      </main>
      <PublicFooter />
    </div>
  );
}
