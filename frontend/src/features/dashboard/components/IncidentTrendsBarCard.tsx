import { EmptyState } from '../../../components/ui/EmptyState/EmptyState';
import styles from './IncidentTrendsBarCard.module.css';

export function IncidentTrendsBarCard() {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Incident Trends</h2>
      </div>
      <EmptyState
        title="No Incident Trends"
        description="No incident trend data available for this week."
      />
    </div>
  );
}
