import { PublicNavbar } from '../../features/public-site/components/PublicNavbar';
import { PageHeaderHero } from '../../features/public-site/components/PageHeaderHero';
import { FinalCTA } from '../../features/public-site/components/FinalCTA';
import { PublicFooter } from '../../features/public-site/components/PublicFooter';
import styles from './PublicServicesPage.module.css';

export function PublicServicesPage() {
  return (
    <div className={styles.pageWrapper}>
      <PublicNavbar />
      <main className={styles.mainContent}>
        <PageHeaderHero
          variant="white"
          eyebrow="SERVICE HEALTH &amp; INVENTORY"
          title="Complete visibility across distributed services and critical dependencies."
          subtitle="Catalog every production component, group services into functional architecture tiers, and monitor status transitions with granular SLA metrics."
        />

        {/* Section 1: Environment Isolation & Catalog */}
        <section className={styles.topologySection}>
          <div className={styles.topologyContainer}>
            <div>
              <div className={styles.eyebrow}>
                <span className={styles.eyebrowDot} />
                <span>ENVIRONMENT TOPOLOGY</span>
              </div>
              <h2 className={styles.sectionTitle}>
                Segment infrastructure by operational environment.
              </h2>
              <p className={styles.sectionDescription}>
                Keep staging regressions separate from production telemetry. SentraOps provides strict environment boundaries, service ownership metadata, and custom probe intervals.
              </p>
              <div className={styles.bulletList}>
                <div className={styles.bulletItem}>
                  <span className={styles.bulletDot} />
                  <span>Environment isolation (Production, Staging, Edge, Disaster Recovery)</span>
                </div>
                <div className={styles.bulletItem}>
                  <span className={styles.bulletDot} />
                  <span>Hierarchical service groups with aggregate health rollups</span>
                </div>
                <div className={styles.bulletItem}>
                  <span className={styles.bulletDot} />
                  <span>Per-service escalation policy overrides and SLA thresholds</span>
                </div>
              </div>
            </div>

            {/* Rebuilt Service Inventory Visual Mockup */}
            <div className={styles.mockupCard}>
              <div className={styles.mockupHeader}>
                <span className={styles.mockupTitle}>Production Inventory &bull; us-east-1</span>
                <span className={styles.mockupBadge}>3 Services Active</span>
              </div>
              <div className={styles.serviceList}>
                <div className={styles.serviceItem}>
                  <div>
                    <div className={styles.serviceName}>Authentication Gateway</div>
                    <div className={styles.serviceMeta}>p99: 24ms &bull; 99.99% Uptime (30d)</div>
                  </div>
                  <span className={styles.statusChipOperational}>
                    ● OPERATIONAL
                  </span>
                </div>

                <div className={styles.serviceItem}>
                  <div>
                    <div className={styles.serviceName}>Core Billing Engine</div>
                    <div className={styles.serviceMeta}>p99: 48ms &bull; 100.0% Uptime (30d)</div>
                  </div>
                  <span className={styles.statusChipOperational}>
                    ● OPERATIONAL
                  </span>
                </div>

                <div className={styles.serviceItem}>
                  <div>
                    <div className={styles.serviceName}>Notification Dispatcher</div>
                    <div className={styles.serviceMeta}>p99: 180ms &bull; Backlog Alert</div>
                  </div>
                  <span className={styles.statusChipDegraded}>
                    ● DEGRADED
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Health Transition States */}
        <section className={styles.healthSection}>
          <div className={styles.healthContainer}>
            <div className={styles.healthHeader}>
              <div className={styles.eyebrow}>
                <span className={styles.eyebrowDot} />
                <span>DETERMINISTIC HEALTH MODEL</span>
              </div>
              <h2 className={styles.sectionTitle}>
                Four clear operational states with zero ambiguity.
              </h2>
            </div>

            <div className={styles.healthGrid}>
              <div className={styles.healthCard}>
                <span className={styles.healthCardLabel} style={{ color: '#16A34A' }}>● UP / OPERATIONAL</span>
                <h4 className={styles.healthCardTitle}>Healthy &amp; Serving Traffic</h4>
                <p className={styles.healthCardDesc}>
                  All health check probes passing with latencies inside defined SLA bounds.
                </p>
              </div>

              <div className={styles.healthCard}>
                <span className={styles.healthCardLabel} style={{ color: '#E8A33D' }}>● DEGRADED</span>
                <h4 className={styles.healthCardTitle}>Elevated Latency or Errors</h4>
                <p className={styles.healthCardDesc}>
                  Service is functional but experiencing queue buildup or error rate spikes.
                </p>
              </div>

              <div className={styles.healthCard}>
                <span className={styles.healthCardLabel} style={{ color: '#DC2626' }}>● DOWN / OUTAGE</span>
                <h4 className={styles.healthCardTitle}>Critical Failure</h4>
                <p className={styles.healthCardDesc}>
                  Probes failing or active critical incident declared. Auto-escalation triggered.
                </p>
              </div>

              <div className={styles.healthCard}>
                <span className={styles.healthCardLabel} style={{ color: '#2563EB' }}>● MAINTENANCE</span>
                <h4 className={styles.healthCardTitle}>Planned Upgrade</h4>
                <p className={styles.healthCardDesc}>
                  Scheduled maintenance window in progress. Pager alerts suppressed.
                </p>
              </div>
            </div>
          </div>
        </section>

        <FinalCTA
          eyebrow="SERVICE OBSERVABILITY"
          title="Deploy real-time health checks across your service fleet."
          subtitle="Define sub-second health probes, group services into architecture tiers, and protect SLAs with automated alerts."
          primaryText="Start Fleet Monitoring"
          primaryLink="/register"
          secondaryText="Explore Incidents"
          secondaryLink="/incidents"
        />
      </main>
      <PublicFooter />
    </div>
  );
}
