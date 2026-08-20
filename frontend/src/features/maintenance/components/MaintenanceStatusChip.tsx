import type { MaintenanceStatus } from '../../../types/domain';
import styles from './MaintenanceStatusChip.module.css';

export interface MaintenanceStatusChipProps {
  status: MaintenanceStatus;
  className?: string;
}

const statusLabels: Record<MaintenanceStatus, string> = {
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export function MaintenanceStatusChip({ status, className }: MaintenanceStatusChipProps) {
  const statusClass = styles[status] || styles.scheduled;
  const label = statusLabels[status] || status;

  return (
    <span className={`${styles.chip} ${statusClass} ${className || ''}`}>
      <span className={styles.dot} />
      <span>{label}</span>
    </span>
  );
}
