import type { Service } from '../../../types/domain';
import { StatusChip } from '../../../components/ui/StatusChip/StatusChip';
import styles from './ServiceOverviewTab.module.css';

export interface ServiceOverviewTabProps {
  service: Service;
}

export function ServiceOverviewTab({ service }: ServiceOverviewTabProps) {
  return (
    <div className={styles.grid}>
      <div className={styles.card}>
        <h4 className={styles.cardTitle}>Status & Availability</h4>
        <div className={styles.detailRow}>
          <span className={styles.label}>Current Status:</span>
          <StatusChip status={service.currentStatus} />
        </div>
        <div className={styles.detailRow}>
          <span className={styles.label}>Consecutive Failures:</span>
          <span className={styles.value}>{service.consecutiveFailures}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.label}>Monitored:</span>
          <span className={styles.value}>{service.isActive ? 'Active' : 'Inactive (Paused)'}</span>
        </div>
      </div>

      <div className={styles.card}>
        <h4 className={styles.cardTitle}>Configuration Details</h4>
        <div className={styles.detailRow}>
          <span className={styles.label}>Target URL:</span>
          <span className={styles.monoValue}>{service.url}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.label}>HTTP Method:</span>
          <span className={styles.value}>{service.httpMethod}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.label}>Expected Status Code:</span>
          <span className={styles.value}>{service.expectedStatusCode}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.label}>Timeout:</span>
          <span className={styles.value}>{service.timeoutMs} ms</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.label}>Check Interval:</span>
          <span className={styles.value}>{service.checkIntervalSeconds} seconds</span>
        </div>
      </div>

      <div className={styles.card}>
        <h4 className={styles.cardTitle}>Metadata & Grouping</h4>
        <div className={styles.detailRow}>
          <span className={styles.label}>Environment:</span>
          <span className={styles.value} style={{ textTransform: 'capitalize' }}>
            {service.environment}
          </span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.label}>Priority:</span>
          <span className={styles.value} style={{ textTransform: 'capitalize' }}>
            {service.priority}
          </span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.label}>Group:</span>
          <span className={styles.value}>{service.group?.name || service.groupId || 'None'}</span>
        </div>
        {service.tags && service.tags.length > 0 && (
          <div className={styles.detailRow}>
            <span className={styles.label}>Tags:</span>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {service.tags.map((tag) => (
                <span key={tag} className={styles.tagChip}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
