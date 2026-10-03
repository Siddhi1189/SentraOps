import { useServicesQuery } from '../../services/hooks/useServices';
import { useIncidentsQuery } from '../../incidents/hooks/useIncidents';
import styles from './DashboardStatCards.module.css';

export function DashboardStatCards() {
  const { data: servicesRes } = useServicesQuery({ page: 1, limit: 50 });
  const { data: incidentsRes } = useIncidentsQuery({ page: 1, limit: 50, status: 'open' });

  const totalServices = servicesRes?.pagination?.total ?? (servicesRes?.data ? servicesRes.data.length : 0);
  const openIncidents = incidentsRes?.pagination?.total ?? (incidentsRes?.data ? incidentsRes.data.length : 0);
  const healthyServices = servicesRes?.data?.filter((s) => s.currentStatus === 'up').length ?? 0;

  const uptimeDisplay = totalServices > 0
    ? `${((healthyServices / totalServices) * 100).toFixed(1)}%`
    : '—';
  const uptimeSubtext = totalServices > 0
    ? `${healthyServices} of ${totalServices} operational`
    : 'No services active';

  return (
    <div className={styles.statsGrid}>
      {/* 1. Total Services */}
      <div className={styles.statCard}>
        <div className={styles.cardHeader}>
          <span className={styles.statLabel}>Total Services</span>
        </div>
        <div className={styles.statValue}>{totalServices}</div>
        <div className={styles.trendPositive}>
          <span>Registered monitors</span>
        </div>
      </div>

      {/* 2. Open Incidents */}
      <div className={styles.statCard}>
        <div className={styles.cardHeader}>
          <span className={styles.statLabel}>Open Incidents</span>
        </div>
        <div className={styles.statValue}>{openIncidents}</div>
        <div className={openIncidents > 0 ? styles.trendNegative : styles.trendPositive}>
          <span>{openIncidents > 0 ? 'Active issues' : 'All clear'}</span>
        </div>
      </div>

      {/* 3. Healthy Services */}
      <div className={styles.statCard}>
        <div className={styles.cardHeader}>
          <span className={styles.statLabel}>Healthy Services</span>
        </div>
        <div className={styles.statValue}>{healthyServices}</div>
        <div className={styles.trendPositive}>
          <span>Status up</span>
        </div>
      </div>

      {/* 4. Service Health */}
      <div className={styles.statCard}>
        <div className={styles.cardHeader}>
          <span className={styles.statLabel}>Current Health</span>
        </div>
        <div className={styles.statValueRow}>
          <span className={styles.statValue}>{uptimeDisplay}</span>
        </div>
        <div className={styles.trendPositive}>
          <span>{uptimeSubtext}</span>
        </div>
      </div>
    </div>
  );
}
