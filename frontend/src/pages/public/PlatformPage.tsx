import { PublicNavbar } from '../../features/public-site/components/PublicNavbar';
import { PageHeaderHero } from '../../features/public-site/components/PageHeaderHero';
import { TopologyLayerCard } from '../../features/public-site/components/TopologyLayerCard';
import { FinalCTA } from '../../features/public-site/components/FinalCTA';
import { PublicFooter } from '../../features/public-site/components/PublicFooter';
import styles from './PlatformPage.module.css';

export function PlatformPage() {
  return (
    <div className={styles.pageWrapper}>
      <PublicNavbar />
      <main className={styles.mainContent}>
        <PageHeaderHero
          variant="white"
          eyebrow="PLATFORM ARCHITECTURE &amp; RESILIENCE"
          title="A deterministic operations platform engineered for high-consequence workloads."
          subtitle="SentraOps combines service health discovery, real-time incident coordination, optimistic concurrency control, and multi-tier escalation in a single unified architecture."
        />

        {/* 4-Tier Architecture Stack */}
        <section className={styles.topologySection}>
          <div className={styles.topologyContainer}>
            <div className={styles.sectionHeader}>
              <div className={styles.eyebrow}>
                <span className={styles.eyebrowDot} />
                <span>SYSTEM TOPOLOGY</span>
              </div>
              <h2 className={styles.sectionTitle}>
                Four layers of operational defense against downtime.
              </h2>
            </div>

            <div className={styles.gridCards}>
              <TopologyLayerCard
                index="01"
                label="INTERFACE LAYER"
                title="Live Sockets &amp; Polling"
                description="Sub-50ms WebSocket event push across operator screens, automatically falling back to HTTP long-polling if corporate network policies restrict socket connections."
              />
              <TopologyLayerCard
                index="02"
                label="CONCURRENCY ENGINE"
                title="Optimistic Concurrency"
                description="Every incident and service update is protected by version tokens. Mid-air edit collisions prompt a safe diff inspection rather than silent overwriting."
                isHighlighted={true}
              />
              <TopologyLayerCard
                index="03"
                label="ESCALATION ROUTING"
                title="Tiered Escalation Engine"
                description="Configurable escalation thresholds (Warning < Incident < Critical) that cascade notifications through on-call responders with per-service rule overrides."
              />
              <TopologyLayerCard
                index="04"
                label="GOVERNANCE"
                title="Immutable Audit Logging"
                description="Every status change, team member mutation, and maintenance trigger is cryptographically sealed in the organization audit log for SOC2 and compliance audits."
              />
            </div>
          </div>
        </section>

        {/* OCC In-Depth Breakdown */}
        <section className={styles.occSection}>
          <div className={styles.occContainer}>
            <div>
              <div className={styles.eyebrow}>
                <span className={styles.eyebrowDot} />
                <span>MID-AIR COLLISION PROTECTION</span>
              </div>
              <h2 className={styles.sectionTitle}>
                How Optimistic Concurrency Control eliminates split-brain incident states.
              </h2>
              <p className={styles.sectionDescription}>
                During major outages, multiple engineers frequently update incident status, write investigation notes, or adjust severities simultaneously. SentraOps attaches version tokens to every state write.
              </p>
              <div className={styles.bulletList}>
                <div className={styles.bulletItem}>
                  <span className={styles.bulletDot} />
                  <span>Version token comparison on every state mutation</span>
                </div>
                <div className={styles.bulletItem}>
                  <span className={styles.bulletDot} />
                  <span>Immediate notification of concurrent edits without losing local draft state</span>
                </div>
                <div className={styles.bulletItem}>
                  <span className={styles.bulletDot} />
                  <span>Deterministic reload and safe merge before committing to the timeline</span>
                </div>
              </div>
            </div>

            {/* Rebuilt OCC Resolver Mockup */}
            <div className={styles.mockupCard}>
              <div className={styles.mockupHeader}>
                <span className={styles.mockupTitle}>OCC Resolver Engine</span>
                <span className={styles.activeChip}>● CONFLICT ENGINE ACTIVE</span>
              </div>
              <div className={styles.logList}>
                <div className={styles.logSuccess}>
                  <span>Operator A:</span> POST /incidents/INC-8942 <span className={styles.logSuccessBadge}>[Token #v14.0 &rarr; ACK 200]</span>
                </div>
                <div className={styles.logConflict}>
                  <div>
                    <span>Operator B:</span> PATCH /incidents/INC-8942 <span className={styles.logConflictBadge}>[Stale Token #v14.0 &rarr; HTTP 409 Conflict]</span>
                  </div>
                  <div className={styles.conflictResolutionSub}>
                    &rarr; State mismatch resolved cleanly: Local buffer preserved &amp; reloaded to #v14.1
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <FinalCTA
          eyebrow="ARCHITECTURE &amp; RESILIENCE"
          title="See the full architecture in your own environment."
          subtitle="Deploy SentraOps with our deterministic state engine, real-time WebSocket fleet topology, and OCC write protection."
          primaryText="Start Architecture Trial"
          primaryLink="/register"
          secondaryText="View Public Status Demo"
          secondaryLink="/status/acme-corp"
        />
      </main>
      <PublicFooter />
    </div>
  );
}
