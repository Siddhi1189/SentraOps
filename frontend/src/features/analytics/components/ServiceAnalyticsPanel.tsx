import { useServiceAnalyticsQuery } from '../hooks/useAnalytics';
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState';
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState';
import styles from './ServiceAnalyticsPanel.module.css';

export interface ServiceAnalyticsPanelProps {
  serviceId: string;
  enabled?: boolean;
}

export function ServiceAnalyticsPanel({ serviceId, enabled = true }: ServiceAnalyticsPanelProps) {
  const { data: res, isLoading, isError, error, refetch } = useServiceAnalyticsQuery(serviceId, enabled);

  if (isLoading) {
    return (
      <div className={styles.skeletonGrid} data-testid="analytics-skeleton">
        <div className={styles.skeletonCard} />
        <div className={styles.skeletonCard} />
        <div className={styles.skeletonCard} />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to Load Service Analytics"
        message={error instanceof Error ? error.message : 'Network error loading analytics'}
        onRetry={refetch}
      />
    );
  }

  const data = res?.data;
  const rolling7 = data?.rolling7Days;
  const rolling30 = data?.rolling30Days;
  const rolling90 = data?.rolling90Days;

  const totalChecksAcrossWindows =
    (rolling7?.totalCount || 0) + (rolling30?.totalCount || 0) + (rolling90?.totalCount || 0);

  // Exact empty state condition: ALL three windows have zero total health checks
  const isZeroHistory =
    totalChecksAcrossWindows === 0 ||
    ((rolling7?.totalCount || 0) === 0 &&
      (rolling30?.totalCount || 0) === 0 &&
      (rolling90?.totalCount || 0) === 0);

  if (isZeroHistory || !data) {
    return (
      <EmptyState
        title="Not enough data yet — check back once monitoring has run for a while"
        description="Monitoring health check results will populate uptime and response latency statistics once health checks begin executing."
      />
    );
  }

  const windows = [
    { label: 'Rolling 7 Days', stats: rolling7 },
    { label: 'Rolling 30 Days', stats: rolling30 },
    { label: 'Rolling 90 Days', stats: rolling90 },
  ];

  return (
    <div className={styles.panelContainer} role="region" aria-label="Service Uptime & Latency Analytics">
      <div className={styles.windowsGrid}>
        {windows.map(({ label, stats }) => {
          const hasData = (stats?.totalCount || 0) > 0;
          return (
            <div key={label} className={styles.windowCard}>
              <h3 className={styles.windowTitle}>{label}</h3>

              <div className={styles.metricsList}>
                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>Uptime</span>
                  <span className={styles.metricValue}>
                    {hasData ? `${stats?.uptimePercent ?? 100}%` : 'N/A'}
                  </span>
                </div>

                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>Avg Latency</span>
                  <span className={styles.metricValue}>
                    {hasData ? `${stats?.avgLatency ?? 0} ms` : 'N/A'}
                  </span>
                </div>

                <div className={styles.metricRow}>
                  <span className={styles.metricLabel}>Failures</span>
                  <span className={styles.metricValue}>
                    {hasData ? `${stats?.failureCount} / ${stats?.totalCount}` : '0 checks'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
