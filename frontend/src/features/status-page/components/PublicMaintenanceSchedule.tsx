import type { StatusPageMaintenanceWindow } from '../../../api/status';
import type { MaintenanceWindow } from '../../../types/domain';
import styles from './PublicMaintenanceSchedule.module.css';

export interface PublicMaintenanceScheduleProps {
  maintenance: Array<StatusPageMaintenanceWindow | MaintenanceWindow>;
  title?: string;
  omitIfEmpty?: boolean;
}

export function PublicMaintenanceSchedule({
  maintenance,
  title = 'Scheduled Maintenance',
  omitIfEmpty = false,
}: PublicMaintenanceScheduleProps) {
  if (!maintenance || maintenance.length === 0) {
    if (omitIfEmpty) return null;

    return (
      <div className={styles.section}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.emptyCard}>No maintenance windows currently scheduled.</div>
      </div>
    );
  }

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.card}>
        {maintenance.map((window) => {
          const serviceName =
            'service' in window && window.service && typeof window.service === 'object' && 'name' in window.service
              ? (window.service as { name: string }).name
              : 'Affected Service';

          return (
            <div key={window.id} className={styles.item}>
              <div className={styles.header}>
                <h4 className={styles.itemTitle}>{window.title}</h4>
                <span className={styles.badge}>{window.status}</span>
              </div>

              {window.description && (
                <p className={styles.description}>{window.description}</p>
              )}

              <div className={styles.meta}>
                <span>Service: <strong>{serviceName}</strong></span>
                <span>Start: {formatDate(window.startTime)}</span>
                <span>End: {formatDate(window.endTime)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
