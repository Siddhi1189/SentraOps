import { PublicNavbar } from '../../features/public-site/components/PublicNavbar';
import { PageHeaderHero } from '../../features/public-site/components/PageHeaderHero';
import { FinalCTA } from '../../features/public-site/components/FinalCTA';
import { PublicFooter } from '../../features/public-site/components/PublicFooter';
import styles from './PublicIncidentsPage.module.css';

export function PublicIncidentsPage() {
  return (
    <div className={styles.pageWrapper}>
      <PublicNavbar />
      <main className={styles.mainContent}>
        <PageHeaderHero
          variant="white"
          eyebrow="INCIDENT RESPONSE &amp; OCC"
          title="Move from alert detection to resolution without operational chaos."
          subtitle="A structured incident response workflow that connects on-call responders, tracks investigation milestones, and guarantees zero mid-air write collisions."
        />

        {/* 4-Stage Lifecycle */}
        <section className={styles.workflowSection}>
          <div className={styles.workflowContainer}>
            <div className={styles.sectionHeader}>
              <div className={styles.eyebrow}>
                <span className={styles.eyebrowDot} />
                <span>STRUCTURED WORKFLOW</span>
              </div>
              <h2 className={styles.sectionTitle}>
                Four clear milestones for every operational incident.
              </h2>
            </div>

            <div className={styles.workflowGrid}>
              <div className={styles.stageCard}>
                <span className={styles.stageLabel} style={{ color: '#E8A33D' }}>
                  STAGE 01 &bull; INVESTIGATING
                </span>
                <h3 className={styles.stageTitle}>
                  Detection &amp; Triage
                </h3>
                <p className={styles.stageDesc}>
                  Automated probe triggers or operator escalation. On-call commander is assigned and paging escalation begins.
                </p>
              </div>

              <div className={styles.stageCard}>
                <span className={styles.stageLabel} style={{ color: '#2563EB' }}>
                  STAGE 02 &bull; IDENTIFIED
                </span>
                <h3 className={styles.stageTitle}>
                  Root Cause Isolated
                </h3>
                <p className={styles.stageDesc}>
                  Responders isolate offending commits, resource starvation, or upstream outages. Mitigation patch is staged.
                </p>
              </div>

              <div className={styles.stageCard}>
                <span className={styles.stageLabel} style={{ color: '#8B5CF6' }}>
                  STAGE 03 &bull; MONITORING
                </span>
                <h3 className={styles.stageTitle}>
                  Fix Verification
                </h3>
                <p className={styles.stageDesc}>
                  Mitigation applied. Telemetry probes monitor recovery curves to verify latency stabilization before closing.
                </p>
              </div>

              <div className={styles.stageCard}>
                <span className={styles.stageLabel} style={{ color: '#16A34A' }}>
                  STAGE 04 &bull; RESOLVED
                </span>
                <h3 className={styles.stageTitle}>
                  Postmortem Sealing
                </h3>
                <p className={styles.stageDesc}>
                  Incident closed with final duration, MTTD, MTTR, and full timeline events cryptographically sealed for review.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Live Cockpit & Public Sync Split View */}
        <section className={styles.syncSection}>
          <div className={styles.syncContainer}>
            <div>
              <div className={styles.eyebrow}>
                <span className={styles.eyebrowDot} />
                <span>SYNCHRONIZED COMMUNICATIONS</span>
              </div>
              <h2 className={styles.sectionTitle}>
                Publish customer status updates with a single click.
              </h2>
              <p className={styles.sectionDescription}>
                Responders can broadcast customer-facing updates directly from the incident response cockpit to your organization&apos;s public status page without context switching.
              </p>
              <div className={styles.bulletList}>
                <div className={styles.bulletItem}>
                  <span className={styles.bulletDot} />
                  <span>Granular visibility flags (Public Status vs Internal Operator Only)</span>
                </div>
                <div className={styles.bulletItem}>
                  <span className={styles.bulletDot} />
                  <span>Automated service health rollup updates on public pages</span>
                </div>
                <div className={styles.bulletItem}>
                  <span className={styles.bulletDot} />
                  <span>Audited postmortem export for enterprise stakeholder review</span>
                </div>
              </div>
            </div>

            {/* Rebuilt Incident Broadcast Mockup */}
            <div className={styles.mockupCard}>
              <div className={styles.mockupHeader}>
                <span className={styles.mockupTitle}>Incident Status Broadcast</span>
                <span className={styles.syncChip}>● SYNC ACTIVE</span>
              </div>
              <div className={styles.mockupContent}>
                <div className={styles.noticeBox}>
                  <div className={styles.noticeLabel}>Public Status Notice:</div>
                  <p className={styles.noticeText}>
                    &ldquo;We have identified elevated latency on ingestion workers. Mitigation is actively deploying across us-east-1.&rdquo;
                  </p>
                </div>
                <div className={styles.footerInfo}>
                  <span className={styles.destinationText}>Destination: status.acme-corp.internal</span>
                  <span className={styles.timestampText}>Broadcasted &bull; 14:22 UTC</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <FinalCTA
          eyebrow="INCIDENT RESPONSE"
          title="Coordinate high-consequence incidents with optimistic concurrency."
          subtitle="Empower responders with deterministic state machines, timestamped postmortem timelines, and OCC write protection."
          primaryText="Start Incident Response Trial"
          primaryLink="/register"
          secondaryText="Explore Platform Overview"
          secondaryLink="/platform"
        />
      </main>
      <PublicFooter />
    </div>
  );
}
