import type { IncidentDetail } from '../types/incidents';
import { StatusChip, type StatusVariant } from '../../../components/ui/StatusChip/StatusChip';
import styles from './IncidentDetailHeader.module.css';

export interface IncidentDetailHeaderProps {
  incident: IncidentDetail;
}

const statusChipMap: Record<IncidentDetail['status'], StatusVariant> = {
  open: 'open',
  investigating: 'investigating',
  identified: 'warning',
  monitoring: 'info',
  resolved: 'resolved',
};

export function IncidentDetailHeader({ incident }: IncidentDetailHeaderProps) {
  const chipVariant = statusChipMap[incident.status] || 'unknown';

  return (
    <div className={styles.card}>
      <div className={styles.topRow}>
        <h1 className={styles.title}>{incident.title}</h1>
        <div className={styles.badges}>
          <StatusChip status={chipVariant} label={incident.status} />
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: 'var(--color-danger)',
            }}
          >
            {incident.severity}
          </span>
        </div>
      </div>

      <div className={styles.metaGrid}>
        <div className={styles.metaItem}>
          <span className={styles.label}>Service Target</span>
          <span className={styles.value}>{incident.service?.name || incident.serviceId}</span>
        </div>

        <div className={styles.metaItem}>
          <span className={styles.label}>Assigned Member</span>
          <span className={styles.value}>
            {incident.assignedUser?.name ||
              (incident.assignedUserId ? 'Assigned' : 'Unassigned')}
          </span>
        </div>

        <div className={styles.metaItem}>
          <span className={styles.label}>Detected At</span>
          <span className={styles.value}>
            {new Date(incident.detectedAt).toLocaleString()}
          </span>
        </div>

        <div className={styles.metaItem}>
          <span className={styles.label}>Resolved At</span>
          <span className={styles.value}>
            {incident.resolvedAt
              ? new Date(incident.resolvedAt).toLocaleString()
              : 'Unresolved'}
          </span>
        </div>
      </div>
    </div>
  );
}
