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
                <li><a href="#limits-supported" className={styles.sidebarLink}>Limits &amp; Supported</a></li>

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

              {/* Limits & Supported */}
              <div id="limits-supported" className={styles.sectionBlock}>
                <h2 className={styles.sectionHeading}>7. Limits &amp; Supported Features</h2>
                <p className={styles.paragraph}>
                  The following quota values are enforced server-side and apply to all organizations on the current plan.
                </p>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1e293b' }}>
                      <th style={{ textAlign: 'left', padding: '8px 12px', color: '#94a3b8' }}>Feature</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', color: '#94a3b8' }}>Limit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Max projects per org', '5'],
                      ['Max monitors per org', '20'],
                      ['Min health-check interval', '30 seconds'],
                      ['Max assertions per monitor', '10'],
                      ['Ingest rate limit (per API key)', '100 events / minute'],
                      ['Health-check data retention', '90 days'],
                      ['Error event retention', '90 days'],
                    ].map(([feat, limit]) => (
                      <tr key={feat} style={{ borderBottom: '1px solid #0f172a' }}>
                        <td style={{ padding: '8px 12px', color: '#cbd5e1' }}>{feat}</td>
                        <td style={{ padding: '8px 12px', color: '#6366f1', fontWeight: 600 }}>{limit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h3 className={styles.sectionSubheading} style={{ marginTop: '1.5rem' }}>Supported Monitor Types</h3>
                <ul className={styles.featureList}>
                  <li><strong>http</strong> — Periodic HTTP/HTTPS check with assertions and SSL monitoring</li>
                  <li><strong>heartbeat</strong> — Ping-based check; marks service down when no ping arrives within interval + grace</li>
                </ul>

                <h3 className={styles.sectionSubheading} style={{ marginTop: '1rem' }}>Supported Assertion Kinds</h3>
                <ul className={styles.featureList}>
                  <li><code>status_code_equals</code> — HTTP status code must equal a value</li>
                  <li><code>body_contains</code> — Response body must contain a keyword</li>
                  <li><code>body_does_not_contain</code> — Response body must not contain a keyword</li>
                  <li><code>json_path_equals</code> — A JSONPath expression must equal a value</li>
                  <li><code>response_time_less_than</code> — Response time must be below N ms</li>
                </ul>

                <h3 className={styles.sectionSubheading} style={{ marginTop: '1rem' }}>Not Supported Yet</h3>
                <ul className={styles.featureList} style={{ color: '#64748b' }}>
                  <li>SMS / phone call alerts</li>
                  <li>Uptime SLA reports (export)</li>
                  <li>Custom data retention beyond 90 days</li>
                  <li>Multi-region distributed checks</li>
                  <li>Browser / Playwright monitors</li>
                  <li>DNS monitors</li>
                  <li>TCP port monitors</li>
                  <li>Stripe or Zapier integrations</li>
                </ul>

                <p className={styles.paragraph} style={{ marginTop: '1rem' }}>
                  Current usage against your quotas is visible in <strong>Settings → Limits &amp; Supported</strong>.
                  The same data is available via the authenticated API endpoint <code>GET /api/v1/limits</code>.
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
