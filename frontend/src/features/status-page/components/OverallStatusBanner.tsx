import type { StatusPageService } from '../../../api/status';
import styles from './OverallStatusBanner.module.css';

export interface OverallStatusBannerProps {
  services: StatusPageService[];
}

export type AggregateStatus = 'up' | 'degraded' | 'down';

export function computeAggregateStatus(services: StatusPageService[]): AggregateStatus {
  if (!services || services.length === 0) return 'up';
  if (services.some((s) => s.currentStatus === 'down')) return 'down';
  if (services.some((s) => s.currentStatus === 'degraded')) return 'degraded';
  return 'up';
}

export function OverallStatusBanner({ services }: OverallStatusBannerProps) {
  const aggregateStatus = computeAggregateStatus(services);

  const config = {
    up: {
      title: 'All Systems Operational',
      subtitle: 'All services are functioning within normal performance metrics.',
      icon: '✓',
      className: styles.up,
    },
    degraded: {
      title: 'Partial Degradation Detected',
      subtitle: 'One or more services are experiencing performance degradation.',
      icon: '⚠',
      className: styles.degraded,
    },
    down: {
      title: 'Major Outage Detected',
      subtitle: 'One or more core services are currently unavailable.',
      icon: '✕',
      className: styles.down,
    },
  }[aggregateStatus];

  return (
    <div className={`${styles.banner} ${config.className}`} role="status">
      <div className={styles.icon} aria-hidden="true">
        {config.icon}
      </div>
      <div className={styles.textGroup}>
        <h2 className={styles.title}>{config.title}</h2>
        <p className={styles.subtitle}>{config.subtitle}</p>
      </div>
    </div>
  );
}
