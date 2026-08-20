import { useIncidentAnalyticsQuery } from '../hooks/useDashboard';
import { Spinner } from '../../../components/ui/Spinner/Spinner';
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState';
import styles from './IncidentSnapshotPanel.module.css';

export function IncidentSnapshotPanel() {
  const { data: analyticsRes, isLoading, isError, error, refetch } = useIncidentAnalyticsQuery();

  const data = analyticsRes?.data;
  const {
    totalIncidents = 0,
    resolvedIncidents = 0,
    mttrHuman = 'N/A',
    severityDistribution = {},
    statusDistribution = {},
  } = data || {};

  const severityOrder = ['low', 'medium', 'high', 'critical'];
  const statusOrder = ['open', 'investigating', 'identified', 'monitoring', 'resolved'];

  // Screen reader textual summary
  const srSummary = `Incident Analytics Snapshot: ${totalIncidents} total incidents, ${resolvedIncidents} resolved. MTTR is ${mttrHuman}.`;

  return (
    <div className={styles.card} role="region" aria-label="Incident Analytics Snapshot">
      <h2 className={styles.title}>Incident Analytics Snapshot</h2>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-6)' }}>
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Failed to Load Incident Analytics Snapshot"
          message={error instanceof Error ? error.message : 'Network error'}
          onRetry={refetch}
        />
      ) : (
        <>
          <span className={styles.srOnly}>{srSummary}</span>

          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <div className={styles.statLabel}>Total Incidents</div>
              <div className={styles.statValue}>{totalIncidents}</div>
            </div>

            <div className={styles.statBox}>
              <div className={styles.statLabel}>Resolved</div>
              <div className={styles.statValue}>{resolvedIncidents}</div>
            </div>

            <div className={styles.statBox}>
              <div className={styles.statLabel}>Mean Time to Resolve</div>
              <div className={styles.statValue}>{mttrHuman}</div>
            </div>
          </div>

          <h3 className={styles.sectionTitle}>Severity Distribution</h3>
          {severityOrder.map((sev) => {
            const count = severityDistribution[sev] || 0;
            const pct = totalIncidents > 0 ? Math.round((count / totalIncidents) * 100) : 0;
            const capSev = sev.charAt(0).toUpperCase() + sev.slice(1);

            return (
              <div key={sev} className={styles.distributionRow}>
                <span className={styles.distLabel}>{sev}</span>
                <div className={styles.barTrack}>
                  <div
                    className={`${styles.barFill} ${styles[`bar${capSev}`]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={styles.distValue}>{count}</span>
              </div>
            );
          })}

          <h3 className={styles.sectionTitle}>Status Distribution</h3>
          {statusOrder.map((st) => {
            const count = statusDistribution[st] || 0;
            const pct = totalIncidents > 0 ? Math.round((count / totalIncidents) * 100) : 0;
            const capSt = st.charAt(0).toUpperCase() + st.slice(1);

            return (
              <div key={st} className={styles.distributionRow}>
                <span className={styles.distLabel}>{st}</span>
                <div className={styles.barTrack}>
                  <div
                    className={`${styles.barFill} ${styles[`bar${capSt}`]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={styles.distValue}>{count}</span>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
