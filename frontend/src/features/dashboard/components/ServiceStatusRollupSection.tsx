import { Link } from 'react-router-dom';
import type { ServiceStatus } from '../../../types/domain';
import { useServicesQuery } from '../../services/hooks/useServices';
import { DASHBOARD_SERVICE_ROLLUP_LIMIT } from '../constants';
import { Spinner } from '../../../components/ui/Spinner/Spinner';
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState';
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState';
import styles from './ServiceStatusRollupSection.module.css';

const statusesToRollup: ServiceStatus[] = ['up', 'down', 'degraded', 'maintenance', 'unknown'];

export function ServiceStatusRollupSection() {
  const { data: servicesData, isLoading, isError, error, refetch } = useServicesQuery({
    page: 1,
    limit: DASHBOARD_SERVICE_ROLLUP_LIMIT,
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
          title="Failed to Load Service Status Rollup"
          message={error instanceof Error ? error.message : 'Network error'}
          onRetry={refetch}
        />
      </div>
    );
  }

  const fetchedServices = servicesData?.data || [];
  const fetchedCount = fetchedServices.length;
  const paginationTotal = servicesData?.pagination?.total;

  // Factual Completeness Labeling using confirmed pagination.total contract directly
  let completenessLabel = `Showing up to ${DASHBOARD_SERVICE_ROLLUP_LIMIT} services`;
  if (typeof paginationTotal === 'number') {
    if (fetchedCount === paginationTotal) {
      completenessLabel = `All services — ${paginationTotal} shown`;
    } else if (fetchedCount < paginationTotal) {
      completenessLabel = `${fetchedCount} of ${paginationTotal} services shown`;
    }
  }

  if (fetchedCount === 0) {
    return (
      <div className={styles.card}>
        <EmptyState
          title="No Services Registered"
          description="There are currently no services registered in your organization."
        />
      </div>
    );
  }

  const counts: Record<ServiceStatus, number> = {
    up: 0,
    down: 0,
    degraded: 0,
    maintenance: 0,
    unknown: 0,
  };

  for (const s of fetchedServices) {
    if (s.currentStatus in counts) {
      counts[s.currentStatus]++;
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Service Status Rollup</h2>
        <span className={styles.completenessLabel} data-testid="service-rollup-completeness">
          {completenessLabel}
        </span>
      </div>

      <div className={styles.grid}>
        {statusesToRollup.map((st) => (
          <Link
            key={st}
            to={`/app/services?status=${st}`}
            className={`${styles.chipLink} ${styles[st]}`}
            data-testid={`status-rollup-chip-${st}`}
          >
            <span className={styles.statusName}>{st}</span>
            <span className={styles.count}>{counts[st]}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
