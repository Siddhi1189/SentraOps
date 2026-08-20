import type { StatusPageOpenIncident } from '../../../api/status';
import type { Incident } from '../../../types/domain';
import styles from './PublicIncidentHistory.module.css';

export interface PublicIncidentHistoryProps {
  incidents: Array<StatusPageOpenIncident | Incident>;
  title?: string;
  emptyMessage?: string;
}

export function PublicIncidentHistory({
  incidents,
  title = 'Incident History',
  emptyMessage = 'No incidents reported.',
}: PublicIncidentHistoryProps) {
  if (!incidents || incidents.length === 0) {
    return (
      <div className={styles.section}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.emptyCard}>{emptyMessage}</div>
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

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'low':
        return styles.low;
      case 'medium':
        return styles.medium;
      case 'high':
        return styles.high;
      case 'critical':
        return styles.critical;
      default:
        return styles.low;
    }
  };

  return (
    <div className={styles.section}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.card}>
        {incidents.map((incident) => {
          const serviceName =
            'service' in incident && incident.service && typeof incident.service === 'object' && 'name' in incident.service
              ? (incident.service as { name: string }).name
              : 'Affected Service';
          const resolvedAt = 'resolvedAt' in incident ? (incident.resolvedAt as string | null) : null;

          return (
            <div key={incident.id} className={styles.item}>
              <div className={styles.header}>
                <h4 className={styles.itemTitle}>{incident.title}</h4>
                <div className={styles.badgeGroup}>
                  <span className={`${styles.badge} ${getSeverityBadgeClass(incident.severity)}`}>
                    {incident.severity}
                  </span>
                  <span className={`${styles.badge} ${styles.low}`}>
                    {incident.status}
                  </span>
                </div>
              </div>

              <div className={styles.meta}>
                <span>Service: <strong>{serviceName}</strong></span>
                <span>Detected: {formatDate(incident.detectedAt)}</span>
                {resolvedAt && <span>Resolved: {formatDate(resolvedAt)}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
