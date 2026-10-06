import { EmptyState } from '../../../components/ui/EmptyState/EmptyState';
import styles from './SystemHealthOverview.module.css';

export function SystemHealthOverview() {
  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>System Health Overview</h2>
      <div className={styles.cardWrapper}>
        <EmptyState
          title="No Subsystem Metrics"
          description="Subsystem health telemetry will appear here once service components are configured."
        />
      </div>
    </div>
  );
}
