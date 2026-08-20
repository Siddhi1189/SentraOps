import { Link } from 'react-router-dom';
import { useIncidentsQuery } from '../../incidents/hooks/useIncidents';
import { DASHBOARD_ATTENTION_INCIDENTS_LIMIT } from '../constants';
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState';
import styles from './AttentionBandSection.module.css';

export function AttentionBandSection() {
  const {
    data: openData,
    isLoading: isLoadingOpen,
    isError: isErrorOpen,
    error: errorOpen,
    refetch: refetchOpen,
  } = useIncidentsQuery({
    page: 1,
    limit: DASHBOARD_ATTENTION_INCIDENTS_LIMIT,
    status: 'open',
  });

  const {
    data: invData,
    isLoading: isLoadingInv,
    isError: isErrorInv,
    error: errorInv,
    refetch: refetchInv,
  } = useIncidentsQuery({
    page: 1,
    limit: DASHBOARD_ATTENTION_INCIDENTS_LIMIT,
    status: 'investigating',
  });

  const isLoading = isLoadingOpen || isLoadingInv;
  const isError = isErrorOpen || isErrorInv;

  if (isLoading) {
    return <div className={styles.skeleton} data-testid="attention-band-skeleton" />;
  }

  if (isError) {
    const err = errorOpen || errorInv;
    return (
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <ErrorState
          title="Failed to Load Active Incidents Attention Status"
          message={err instanceof Error ? err.message : 'Network error'}
          onRetry={() => {
            refetchOpen();
            refetchInv();
          }}
        />
      </div>
    );
  }

  const openIncidents = openData?.data || [];
  const invIncidents = invData?.data || [];
  const totalActive = openIncidents.length + invIncidents.length;

  // ABSENT (returns null) ONLY AFTER both queries successfully resolve and totalActive === 0
  if (totalActive === 0) {
    return null;
  }

  return (
    <div className={styles.container} role="region" aria-label="Attention Band">
      <div className={styles.content}>
        <div className={styles.titleGroup}>
          <span className={styles.icon} aria-hidden="true">⚠️</span>
          <div>
            <h2 className={styles.title}>
              Attention band summarizing currently open/investigating incidents ({totalActive})
            </h2>
            <p className={styles.subtext}>
              {openIncidents.length} open, {invIncidents.length} under investigation
            </p>
          </div>
        </div>
        <Link to="/incidents" className={styles.link}>
          View Active Incidents →
        </Link>
      </div>
    </div>
  );
}
