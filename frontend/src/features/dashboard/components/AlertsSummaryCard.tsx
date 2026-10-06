import { EmptyState } from '../../../components/ui/EmptyState/EmptyState';
import styles from './AlertsSummaryCard.module.css';

export function AlertsSummaryCard() {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Alerts Summary (This Week)</h2>
      </div>
      <EmptyState
        title="No Alerts"
        description="No alert notifications recorded for this period."
      />
    </div>
  );
}
