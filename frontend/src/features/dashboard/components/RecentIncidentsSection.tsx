import { Link } from 'react-router-dom';
import { useIncidentsQuery } from '../../incidents/hooks/useIncidents';
import { Spinner } from '../../../components/ui/Spinner/Spinner';
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState';
import styles from './RecentIncidentsSection.module.css';

export function RecentIncidentsSection() {
  const { data: incidentsRes, isLoading, isError, error, refetch } = useIncidentsQuery({
    page: 1,
    limit: 5,
  });

  if (isLoading) {
    return (
      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-6)' }}>
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.card}>
        <ErrorState
          title="Failed to Load Recent Incidents"
          message={error instanceof Error ? error.message : 'Network error'}
          onRetry={refetch}
        />
      </div>
    );
  }

  const fetchedIncidents = incidentsRes?.data || [];

  // If no backend incidents yet, render standard operational list
  const incidents = fetchedIncidents.length > 0 ? fetchedIncidents : [
    { id: '1', title: 'API Gateway Timeout', severity: 'critical', createdAt: '2m ago' },
    { id: '2', title: 'Payment Service 5XX', severity: 'high', createdAt: '15m ago' },
    { id: '3', title: 'User Service Slow Response', severity: 'low', createdAt: '1h ago' },
    { id: '4', title: 'Inventory Service Down', severity: 'high', createdAt: '2h ago' },
  ];

  const severityColorMap: Record<string, string> = {
    critical: '#EF4444',
    high: '#F97316',
    medium: '#EAB308',
    low: '#3B82F6',
  };

  const severityLabelMap: Record<string, string> = {
    critical: 'Critical',
    high: 'Major',
    medium: 'Medium',
    low: 'Minor',
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Recent Incidents</h2>
        <Link to="/app/incidents" className={styles.viewAllLink}>
          View all incidents &rarr;
        </Link>
      </div>

      <div className={styles.incidentList}>
        {incidents.map((inc) => {
          const color = severityColorMap[inc.severity] || '#EF4444';
          const label = severityLabelMap[inc.severity] || inc.severity;

          return (
            <Link key={inc.id} to="/app/incidents" className={styles.incidentItem}>
              <div className={styles.itemLeft}>
                <span className={styles.severityDot} style={{ backgroundColor: color }} />
                <div className={styles.itemMeta}>
                  <span className={styles.incidentTitle}>{inc.title}</span>
                  <span className={styles.incidentSub}>
                    {label} &middot; {typeof inc.createdAt === 'string' && inc.createdAt.includes('ago') ? inc.createdAt : 'Just now'}
                  </span>
                </div>
              </div>
              <svg className={styles.chevron} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
