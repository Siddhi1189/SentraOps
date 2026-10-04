import { PublicNavbar } from '../../features/public-site/components/PublicNavbar';
import { PublicFooter } from '../../features/public-site/components/PublicFooter';
import styles from './DocsPage.module.css';

export function DocsPage() {
  return (
    <div className={styles.page}>
      <PublicNavbar />

      <main className={styles.main}>
        {/* Header Hero */}
        <section className={styles.heroSection}>
          <div className={styles.heroContainer}>
            <span className={styles.categoryBadge}>DOCUMENTATION &amp; GUIDES</span>
            <h1 className={styles.heroTitle}>SentraOps Documentation</h1>
            <p className={styles.heroSubtitle}>
              Comprehensive guides, API specifications, monitoring concepts, and incident management workflows.
            </p>
          </div>
        </section>

        {/* Documentation Content Grid */}
        <section className={styles.contentSection}>
          <div className={styles.gridContainer}>
            {/* Quick Links Nav */}
            <aside className={styles.sidebar}>
              <h3 className={styles.sidebarTitle}>Topics</h3>
              <ul className={styles.sidebarList}>
                <li><a href="#quickstart" className={styles.sidebarLink}>Quickstart</a></li>
                <li><a href="#architecture" className={styles.sidebarLink}>Platform Architecture</a></li>
                <li><a href="#services-monitoring" className={styles.sidebarLink}>Services &amp; Monitoring</a></li>
                <li><a href="#incidents-alerts" className={styles.sidebarLink}>Incidents &amp; Alerts</a></li>
                <li><a href="#status-pages" className={styles.sidebarLink}>Public Status Pages</a></li>
                <li><a href="#api-reference" className={styles.sidebarLink}>API Reference</a></li>
                <li><a href="#releases-cicd" className={styles.sidebarLink}>Releases &amp; Deploys</a></li>
              </ul>
            </aside>

            {/* Article Content */}
            <article className={styles.article}>
              {/* Quickstart */}
              <div id="quickstart" className={styles.sectionBlock}>
                <h2 className={styles.sectionHeading}>1. Quickstart</h2>
                <p className={styles.paragraph}>
                  SentraOps provides real-time infrastructure uptime monitoring, deterministic incident state machines,
                  and automated multi-channel notification dispatch.
                </p>
                <div className={styles.codeBlock}>
                  <code>
                    {`# Health-check the SentraOps API
curl https://api.sentraops.com/health

# Response
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2026-10-03T14:30:00.000Z"
}`}
                  </code>
                </div>
              </div>

              {/* Architecture */}
              <div id="architecture" className={styles.sectionBlock}>
                <h2 className={styles.sectionHeading}>2. Platform Architecture</h2>
                <p className={styles.paragraph}>
                  The platform consists of an Express REST API backend, PostgreSQL database with Prisma ORM,
                  Redis caching and BullMQ background job queues, and a Vite/React TypeScript single-page application.
                </p>
                <ul className={styles.bulletList}>
                  <li><strong>Core API:</strong> Authenticated JWT endpoints with tenant isolation per organization.</li>
                  <li><strong>Active Probers:</strong> Periodic background workers executing HTTP health checks.</li>
                  <li><strong>State Machine:</strong> Deterministic transitions between open, investigating, identified, monitoring, and resolved incident states.</li>
                </ul>
              </div>

              {/* Services & Monitoring */}
              <div id="services-monitoring" className={styles.sectionBlock}>
                <h2 className={styles.sectionHeading}>3. Services &amp; Monitoring</h2>
                <p className={styles.paragraph}>
                  Configure monitors for your HTTP/HTTPS endpoints, APIs, and microservices. Set custom check intervals,
                  HTTP request methods, timeouts, and expected status codes.
                </p>
              </div>

              {/* Incidents & Alerts */}
              <div id="incidents-alerts" className={styles.sectionBlock}>
                <h2 className={styles.sectionHeading}>4. Incidents &amp; Escalations</h2>
                <p className={styles.paragraph}>
                  When consecutive health check failures reach defined thresholds, SentraOps automatically creates an incident,
                  logs timeline events, and triggers escalation policies to alert on-call responders via Email, Slack, or Webhook.
                </p>
              </div>

              {/* Status Pages */}
              <div id="status-pages" className={styles.sectionBlock}>
                <h2 className={styles.sectionHeading}>5. Public Status Pages</h2>
                <p className={styles.paragraph}>
                  Every organization can publish a dedicated, publicly accessible status page at <code>/status/:orgSlug</code>.
                  Status pages display active service health, ongoing incidents, and upcoming scheduled maintenance windows
                  with cached Redis acceleration.
                </p>
              </div>

              {/* API Reference */}
              <div id="api-reference" className={styles.sectionBlock}>
                <h2 className={styles.sectionHeading}>6. API Reference</h2>
                <p className={styles.paragraph}>
                  Interactive OpenAPI / Swagger documentation is available at <code>/api/v1/docs</code> and <code>/docs</code>.
                  All mutating endpoints enforce Optimistic Concurrency Control (OCC) and write immutable audit logs.
                </p>
              </div>

              {/* Releases, Deploys & CI/CD */}
              <div id="releases-cicd" className={styles.sectionBlock}>
                <h2 className={styles.sectionHeading}>7. Releases, Deploys &amp; CI/CD Tracking</h2>
                <p className={styles.paragraph}>
                  SentraOps correlates error events and regressions with deployed application versions.
                  Notify SentraOps whenever a new build or deploy is released to your environment.
                </p>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '16px 0 8px 0', color: 'var(--color-text-primary)' }}>
                  GitHub Actions Example Step
                </h3>
                <div className={styles.codeBlock}>
                  <code>
{`- name: Notify SentraOps Release
  if: success()
  run: |
    curl -s -X POST "\${{ secrets.SENTRAOPS_URL }}/api/ingest/releases" \\
      -H "Content-Type: application/json" \\
      -H "x-sentraops-key: \${{ secrets.SENTRAOPS_API_KEY }}" \\
      -d '{
        "version": "\${{ github.ref_name }}",
        "commitSha": "\${{ github.sha }}",
        "environment": "production"
      }'`}
                  </code>
                </div>
                <p className={styles.paragraph} style={{ marginTop: '12px' }}>
                  When an event is captured by the SentraOps Node SDK or API with a <code>release</code> tag,
                  it links to the tracked release. If a previously resolved issue re-occurs in a release newer than
                  <code>resolvedInRelease</code>, SentraOps automatically flags the issue with a
                  <strong>&quot;Regression in &lt;version&gt;&quot;</strong> indicator and notifies responders.
                </p>
              </div>
            </article>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

export default DocsPage;
