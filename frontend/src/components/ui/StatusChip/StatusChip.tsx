import styles from './StatusChip.module.css';

export type StatusVariant =
  | 'up'
  | 'down'
  | 'degraded'
  | 'maintenance'
  | 'unknown'
  | 'open'
  | 'investigating'
  | 'resolved'
  | 'critical'
  | 'warning'
  | 'info'
  | 'success'
  | 'danger';

export interface StatusChipProps {
  status: StatusVariant;
  label?: string;
  className?: string;
}

export function StatusChip({ status, label, className }: StatusChipProps) {
  const variantClass = styles[status] || styles.unknown;

  return (
    <span className={`${styles.chip} ${variantClass} ${className || ''}`}>
      <span className={styles.dot} />
      <span>{label || status}</span>
    </span>
  );
}
