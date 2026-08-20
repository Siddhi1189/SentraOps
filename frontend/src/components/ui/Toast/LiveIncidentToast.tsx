import { Link } from 'react-router-dom';
import type { IncidentCreatedPayload } from '../../../lib/socketEvents';
import styles from './LiveIncidentToast.module.css';

export interface LiveIncidentNotification {
  id: string;
  incident: IncidentCreatedPayload['incident'];
}

export interface LiveIncidentToastProps {
  notifications: LiveIncidentNotification[];
  onDismiss: (id: string) => void;
}

export function LiveIncidentToast({ notifications, onDismiss }: LiveIncidentToastProps) {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div
      className={styles.toastContainer}
      aria-live="polite"
      aria-atomic="true"
      role="region"
      aria-label="Real-time Incident Alerts"
    >
      {notifications.map((item) => {
        const { incident } = item;
        const severityClass = styles[incident.severity] || styles.medium;

        return (
          <div key={item.id} className={styles.toast}>
            <div className={styles.header}>
              <div className={styles.titleGroup}>
                <span className={styles.icon} aria-hidden="true">🚨</span>
                <span className={styles.label}>New Incident Created</span>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => onDismiss(item.id)}
                aria-label="Dismiss alert"
              >
                ×
              </button>
            </div>

            <p className={styles.incidentTitle}>{incident.title}</p>

            <div className={styles.meta}>
              <span className={`${styles.badge} ${severityClass}`}>
                {incident.severity}
              </span>
              <Link
                to={`/incidents/${incident.id}`}
                className={styles.viewLink}
                onClick={() => onDismiss(item.id)}
              >
                View Incident Details →
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
