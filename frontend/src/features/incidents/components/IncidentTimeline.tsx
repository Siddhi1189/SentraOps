import type { TimelineEvent } from '../types/incidents';
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState';
import styles from './IncidentTimeline.module.css';

export interface IncidentTimelineProps {
  events: TimelineEvent[];
}

const EVENT_ICONS: Record<string, string> = {
  INCIDENT_CREATED: '🚨',
  STATUS_CHANGED: '🔄',
  ASSIGNED: '👤',
  RESOLVED: '✅',
  COMMENT_ADDED: '💬',
};

const EVENT_LABELS: Record<string, string> = {
  INCIDENT_CREATED: 'Incident Detected & Created',
  STATUS_CHANGED: 'Status / Severity Updated',
  ASSIGNED: 'Incident Assignment Changed',
  RESOLVED: 'Incident Resolved',
  COMMENT_ADDED: 'Triage Note Added',
};

export function IncidentTimeline({ events }: IncidentTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className={styles.card}>
        <h3 className={styles.title}>Incident Audit Timeline</h3>
        <EmptyState
          title="No Timeline Events"
          description="Timeline audit logs for this incident will appear here chronologically."
        />
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Incident Audit Timeline</h3>

      <ol className={styles.timelineList}>
        {events.map((event) => {
          const icon = EVENT_ICONS[event.eventType] || '📌';
          const label = EVENT_LABELS[event.eventType] || event.eventType;

          return (
            <li key={event.id} className={styles.item}>
              <div className={styles.iconContainer} aria-hidden="true">
                {icon}
              </div>

              <div className={styles.content}>
                <div className={styles.headerRow}>
                  <span className={styles.eventTypeLabel}>{label}</span>
                  <span className={styles.timestamp}>
                    {new Date(event.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className={styles.description}>{event.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
