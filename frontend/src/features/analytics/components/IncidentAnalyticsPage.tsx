import { useState } from 'react';
import { useIncidentAnalyticsQuery } from '../hooks/useAnalytics';
import { useServicesQuery } from '../../services/hooks/useServices';
import { PageHeader } from '../../../components/ui/PageHeader/PageHeader';
import { Select } from '../../../components/ui/Select/Select';
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState';
import styles from './IncidentAnalyticsPage.module.css';

export function IncidentAnalyticsPage() {
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');

  const { data: servicesRes } = useServicesQuery({ page: 1, limit: 100 });
  const services = servicesRes?.data || [];

  const {
    data: analyticsRes,
    isLoading,
    isError,
    error,
    refetch,
  } = useIncidentAnalyticsQuery(selectedServiceId ? { serviceId: selectedServiceId } : undefined);

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

  // Visually-hidden textual summary for accessibility
  const srSummary = `Incident Analytics Summary: ${totalIncidents} total incidents, ${resolvedIncidents} resolved. Mean time to resolve is ${mttrHuman}.`;

  return (
    <div className={styles.container} role="region" aria-label="Incident Analytics">
      <div className={styles.filterHeader}>
        <PageHeader
          title="Incident Analytics"
          description="Organization-wide and service-scoped incident frequency, resolution MTTR, and distribution metrics."
        />

        <div className={styles.filterBox}>
          <Select
            label="Filter by Service"
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            options={[
              { label: 'All Services (Organization-wide)', value: '' },
              ...services.map((s) => ({ label: s.name, value: s.id })),
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <div className={styles.statsGrid}>
          <div className={styles.skeletonCard} />
          <div className={styles.skeletonCard} />
          <div className={styles.skeletonCard} />
        </div>
      ) : isError ? (
        <ErrorState
          title="Failed to Load Incident Analytics"
          message={error instanceof Error ? error.message : 'Network error'}
          onRetry={refetch}
        />
      ) : (
        <>
          <span className={styles.srOnly}>{srSummary}</span>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Total Incidents</span>
              <span className={styles.statValue}>{totalIncidents}</span>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statLabel}>Resolved Incidents</span>
              <span className={styles.statValue}>{resolvedIncidents}</span>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statLabel}>Mean Time to Resolve (MTTR)</span>
              <span className={styles.statValue}>{mttrHuman}</span>
            </div>
          </div>

          <div className={styles.distributionSection}>
            <div className={styles.distCard}>
              <h2 className={styles.sectionTitle}>Severity Distribution</h2>
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
            </div>

            <div className={styles.distCard}>
              <h2 className={styles.sectionTitle}>Status Distribution</h2>
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
            </div>
          </div>
        </>
      )}
    </div>
  );
}
