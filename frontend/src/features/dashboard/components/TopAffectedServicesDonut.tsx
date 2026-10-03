import { EmptyState } from '../../../components/ui/EmptyState/EmptyState';
import styles from './TopAffectedServicesDonut.module.css';

export function TopAffectedServicesDonut() {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Top Affected Services</h2>
      </div>
      <EmptyState
        title="No Affected Services"
        description="No services have been impacted by incidents."
      />
    </div>
  );
}
