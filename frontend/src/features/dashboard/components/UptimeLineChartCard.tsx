import { EmptyState } from '../../../components/ui/EmptyState/EmptyState';
import styles from './UptimeLineChartCard.module.css';

export function UptimeLineChartCard() {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Service Uptime (Last 30 Days)</h2>
      </div>
      <EmptyState
        title="No Uptime History"
        description="Continuous 30-day time-series telemetry will appear here once monitoring data is collected."
      />
    </div>
  );
}
