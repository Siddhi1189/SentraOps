import type { ErrorEventDetail } from '../types/issues';
import styles from './EventDetailsPanel.module.css';

export interface EventDetailsPanelProps {
  event?: ErrorEventDetail | null;
}

export function EventDetailsPanel({ event }: EventDetailsPanelProps) {
  if (!event) return null;

  const tags = event.tags || {};
  const user = event.user || null;
  const request = event.request || null;

  return (
    <div className={styles.container}>
      {/* Tags Card */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Tags</div>
        {Object.keys(tags).length === 0 ? (
          <div className={styles.empty}>No custom tags recorded.</div>
        ) : (
          <div className={styles.tagsGrid}>
            {Object.entries(tags).map(([k, v]) => (
              <span key={k} className={styles.tagBadge}>
                <span className={styles.tagKey}>{k}:</span> <span className={styles.tagVal}>{String(v)}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* User Card */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>User Context</div>
        {!user ? (
          <div className={styles.empty}>Anonymous / No user context attached.</div>
        ) : (
          <div className={styles.detailList}>
            {user.id && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>User ID</span>
                <span className={styles.detailValue}>{user.id}</span>
              </div>
            )}
            {user.email && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Email</span>
                <span className={styles.detailValue}>{user.email}</span>
              </div>
            )}
            {user.username && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Username</span>
                <span className={styles.detailValue}>{user.username}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Request Card */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>HTTP Request</div>
        {!request ? (
          <div className={styles.empty}>No HTTP request context attached.</div>
        ) : (
          <div className={styles.detailList}>
            {request.method && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Method</span>
                <span className={styles.detailValue}>{request.method.toUpperCase()}</span>
              </div>
            )}
            {request.url && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>URL</span>
                <span className={styles.detailValue}>{request.url}</span>
              </div>
            )}
            {request.headers?.['user-agent'] && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>User Agent</span>
                <span className={styles.detailValue}>{request.headers['user-agent']}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Release & Deploy Marker Card */}
      <div className={styles.card} data-testid="release-marker-card">
        <div className={styles.cardTitle}>Release & Deploy Marker</div>
        {!event.release && !event.releaseRef ? (
          <div className={styles.empty}>No release version tagged with this event.</div>
        ) : (
          <div className={styles.detailList}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Release Version</span>
              <span className={styles.detailValue} style={{ fontWeight: 600, fontFamily: 'var(--font-mono, monospace)' }}>
                {event.releaseRef?.version || event.release}
              </span>
            </div>
            {event.releaseRef?.commitSha && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Commit SHA</span>
                <span className={styles.detailValue} style={{ fontFamily: 'var(--font-mono, monospace)' }}>
                  {event.releaseRef.commitSha.substring(0, 8)}
                </span>
              </div>
            )}
            {event.releaseRef?.deployedAt && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Deployed At</span>
                <span className={styles.detailValue}>
                  {new Date(event.releaseRef.deployedAt).toLocaleString()}
                </span>
              </div>
            )}
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Environment</span>
              <span className={styles.detailValue} style={{ textTransform: 'capitalize' }}>
                {event.releaseRef?.environment || event.environment}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventDetailsPanel;
