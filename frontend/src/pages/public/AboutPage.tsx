import { Link } from 'react-router-dom';
import { PublicNavbar } from '../../features/public-site/components/PublicNavbar';
import { PageHeaderHero } from '../../features/public-site/components/PageHeaderHero';
import { PublicFooter } from '../../features/public-site/components/PublicFooter';
import styles from './AboutPage.module.css';

export function AboutPage() {
  return (
    <div className={styles.pageWrapper}>
      <PublicNavbar />
      <main className={styles.mainContent}>
        <PageHeaderHero
          variant="white"
          eyebrow="ABOUT SENTRAOPS &amp; PHILOSOPHY"
          title="Building the foundation for calm, resilient engineering operations."
          subtitle="SentraOps is an engineering-first platform designed to eliminate operational ambiguity, alert fatigue, and write collision friction during high-consequence moments."
        />

        {/* Editorial Essay & Mission */}
        <section className={styles.philosophySection}>
          <div className={styles.philosophyContainer}>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              <span>OUR OPERATIONAL PHILOSOPHY</span>
            </div>
            <h2 className={styles.philosophyHeading}>
              In modern distributed systems, complexity is inevitable, but chaos is a choice.
            </h2>
            <div className={styles.philosophyBody}>
              <p>
                When distributed services degrade, engineering teams are pushed into intense pressure. In those critical minutes, fragmented dashboards, noisy pager alerts, and colliding manual updates create friction that slows resolution.
              </p>
              <p>
                We believe operational software should be calm, deterministic, and precise. Instead of burying responders in hundreds of unprioritized alerts, SentraOps connects service topology, optimistic concurrency conflict protection, tiered escalation, and customer status pages into a unified operational model.
              </p>
            </div>

            {/* Pull-Quote on Muted Surface */}
            <div className={styles.quoteCard}>
              <p className={styles.quoteText}>
                &ldquo;Engineering trust is won through transparency. When you give responders clear state machines and give customers honest status updates, downtime becomes a manageable engineering event rather than a crisis.&rdquo;
              </p>
            </div>
          </div>
        </section>

        {/* 4 Core Principles */}
        <section className={styles.principlesSection}>
          <div className={styles.principlesContainer}>
            <div className={styles.sectionHeader}>
              <div className={styles.eyebrow}>
                <span className={styles.eyebrowDot} />
                <span>CORE ARCHITECTURE TENETS</span>
              </div>
              <h2 className={styles.sectionTitle}>
                Four principles guiding every line of SentraOps.
              </h2>
            </div>

            <div className={styles.principlesGrid}>
              <div className={styles.principleCard}>
                <span className={styles.principleNumber}>01 / CLARITY</span>
                <h3 className={styles.principleTitle}>Zero Ambiguity</h3>
                <p className={styles.principleDesc}>
                  Every service state and incident milestone is deterministic. Responders never have to guess who owns a service or what state an incident is in.
                </p>
              </div>

              <div className={styles.principleCard}>
                <span className={styles.principleNumber}>02 / RESILIENCE</span>
                <h3 className={styles.principleTitle}>Optimistic Concurrency</h3>
                <p className={styles.principleDesc}>
                  Multiple engineers updating the same incident never overwrite each other blindly. Version tokens ensure mid-air collisions are safely resolved.
                </p>
              </div>

              <div className={styles.principleCard}>
                <span className={styles.principleNumber}>03 / RESTRAINT</span>
                <h3 className={styles.principleTitle}>Eliminate Alert Fatigue</h3>
                <p className={styles.principleDesc}>
                  Maintenance windows automatically suppress alarm notifications for planned work, ensuring pages only trigger when real action is required.
                </p>
              </div>

              <div className={styles.principleCard}>
                <span className={styles.principleNumber}>04 / TRUST</span>
                <h3 className={styles.principleTitle}>Customer Transparency</h3>
                <p className={styles.principleDesc}>
                  Publish customer updates directly from the response cockpit, building enterprise credibility during planned and unplanned events.
                </p>
              </div>
            </div>

            {/* Quiet Link to Platform */}
            <div className={styles.ctaWrap}>
              <Link to="/platform" className={styles.platformLink}>
                <span>Explore Platform Architecture</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
