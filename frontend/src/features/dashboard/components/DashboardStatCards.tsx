import { useServicesQuery } from '../../services/hooks/useServices';
import { useIncidentsQuery } from '../../incidents/hooks/useIncidents';
import styles from './DashboardStatCards.module.css';

export function DashboardStatCards() {
  const { data: servicesRes } = useServicesQuery({ page: 1, limit: 50 });
  const { data: incidentsRes } = useIncidentsQuery({ page: 1, limit: 50, status: 'open' });

  const totalServices = servicesRes?.pagination?.total ?? (servicesRes?.data?.length || 248);
  const openIncidents = incidentsRes?.pagination?.total ?? (incidentsRes?.data?.length || 14);
  const healthyServices = servicesRes?.data?.filter((s) => s.currentStatus === 'up').length || 892;

  return (
    <div className={styles.statsGrid}>
      {/* 1. Total Services */}
      <div className={styles.statCard}>
        <div className={styles.cardHeader}>
          <span className={styles.statLabel}>Total Services</span>
        </div>
        <div className={styles.statValue}>{totalServices}</div>
        <div className={styles.trendPositive}>
          <span>&uarr; 15% vs last 7 days</span>
        </div>
      </div>

      {/* 2. Open Incidents */}
      <div className={styles.statCard}>
        <div className={styles.cardHeader}>
          <span className={styles.statLabel}>Open Incidents</span>
        </div>
        <div className={styles.statValue}>{openIncidents}</div>
        <div className={styles.trendNegative}>
          <span>&darr; 8% vs last week</span>
        </div>
      </div>

      {/* 3. Healthy Services */}
      <div className={styles.statCard}>
        <div className={styles.cardHeader}>
          <span className={styles.statLabel}>Healthy Services</span>
        </div>
        <div className={styles.statValue}>{healthyServices}</div>
        <div className={styles.trendPositive}>
          <span>&uarr; 2% vs last month</span>
        </div>
      </div>

      {/* 4. Uptime 30d */}
      <div className={styles.statCard}>
        <div className={styles.cardHeader}>
          <span className={styles.statLabel}>Uptime (30d)</span>
        </div>
        <div className={styles.statValueRow}>
          <span className={styles.statValue}>99.99%</span>
          {/* Mini SVG Sparkline */}
          <svg className={styles.miniSparkline} viewBox="0 0 60 28" fill="none">
            <polyline
              points="0,24 10,20 20,22 30,14 40,16 50,8 60,4"
              stroke="#16A34A"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className={styles.trendPositive}>
          <span>Excellent</span>
        </div>
      </div>
    </div>
  );
}
