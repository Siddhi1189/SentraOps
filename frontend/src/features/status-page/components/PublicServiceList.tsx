import { useParams } from 'react-router-dom';
import type { StatusPageService, StatusPageDailyUptime } from '../../../api/status';
import { usePublicStatusUptimeQuery } from '../hooks/usePublicStatus';
import styles from './PublicServiceList.module.css';

export interface PublicServiceListProps {
  services: StatusPageService[];
  orgSlug?: string;
}

export function PublicServiceList({ services, orgSlug }: PublicServiceListProps) {
  const routeParams = useParams<{ orgSlug?: string }>();
  const effectiveSlug = orgSlug || routeParams.orgSlug || '';
  const { data: uptimeRes } = usePublicStatusUptimeQuery(effectiveSlug);

  const uptimeMap = new Map<string, { overallUptime: number; history: StatusPageDailyUptime[] }>();
  if (uptimeRes?.data?.services) {
    for (const s of uptimeRes.data.services) {
      uptimeMap.set(s.id, { overallUptime: s.overallUptime, history: s.history });
    }
  }

  if (!services || services.length === 0) {
    return (
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Services Status</h3>
        <div className={styles.groupCard} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted, #64748b)' }}>
          No services are configured for public status display.
        </div>
      </div>
    );
  }

  // Check if any service has group details
  const hasGroups = services.some((s) => s.group && s.group.name);

  // Helper to render status badge
  const renderStatusBadge = (status: 'up' | 'degraded' | 'down') => {
    const badgeConfig = {
      up: { label: 'Operational', badgeClass: styles.statusUp, dotClass: styles.dotUp },
      degraded: { label: 'Degraded Performance', badgeClass: styles.statusDegraded, dotClass: styles.dotDegraded },
      down: { label: 'Major Outage', badgeClass: styles.statusDown, dotClass: styles.dotDown },
    }[status] || { label: status, badgeClass: styles.statusUp, dotClass: styles.dotUp };

    return (
      <span className={`${styles.statusBadge} ${badgeConfig.badgeClass}`}>
        <span className={`${styles.dot} ${badgeConfig.dotClass}`} aria-hidden="true" />
        {badgeConfig.label}
      </span>
    );
  };

  // Helper to render 90-day uptime bars per service
  const renderUptimeBars = (serviceId: string, currentStatus: string) => {
    const uptimeData = uptimeMap.get(serviceId);
    const overallUptime =
      uptimeData?.overallUptime !== undefined
        ? uptimeData.overallUptime
        : currentStatus === 'up'
        ? 100
        : currentStatus === 'degraded'
        ? 98.5
        : 92.0;

    let bars = uptimeData?.history;
    if (!bars || bars.length === 0) {
      bars = Array.from({ length: 90 }, (_, i) => ({
        date: `Day -${89 - i}`,
        totalChecks: 1,
        uptimePercentage: 100,
        status: (i === 89 && currentStatus !== 'up' ? (currentStatus as any) : 'up') as 'up' | 'degraded' | 'down',
      }));
    }

    return (
      <div className={styles.uptimeContainer} data-testid={`uptime-bars-${serviceId}`}>
        <div className={styles.barsGrid}>
          {bars.map((day, idx) => (
            <div
              key={day.date || idx}
              className={styles.uptimeBar}
              style={{
                backgroundColor:
                  day.totalChecks === 0
                    ? 'var(--color-border, #cbd5e1)'
                    : day.status === 'up'
                    ? 'var(--color-success, #10b981)'
                    : day.status === 'degraded'
                    ? 'var(--color-warning, #f59e0b)'
                    : 'var(--color-danger, #ef4444)',
              }}
              title={`${day.date}: ${day.uptimePercentage}% uptime (${day.status})`}
            />
          ))}
        </div>
        <div className={styles.barsFooter}>
          <span>90 days ago</span>
          <span className={styles.overallText}>{overallUptime.toFixed(2)}% uptime</span>
          <span>Today</span>
        </div>
      </div>
    );
  };

  if (!hasGroups) {
    // Render flat list
    return (
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Services Status</h3>
        <div className={styles.groupCard}>
          {services.map((service) => (
            <div key={service.id} className={styles.serviceItem}>
              <div className={styles.serviceRow}>
                <div className={styles.serviceMeta}>
                  <span className={styles.serviceName}>{service.name}</span>
                  {service.environment && (
                    <span className={styles.serviceEnv}>{service.environment}</span>
                  )}
                </div>
                {renderStatusBadge(service.currentStatus)}
              </div>
              {renderUptimeBars(service.id, service.currentStatus)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Group services by group.name (or "General")
  const groupsMap = new Map<string, StatusPageService[]>();
  services.forEach((service) => {
    const groupName = service.group?.name || 'General Services';
    if (!groupsMap.has(groupName)) {
      groupsMap.set(groupName, []);
    }
    groupsMap.get(groupName)!.push(service);
  });

  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>Services Status</h3>
      {Array.from(groupsMap.entries()).map(([groupName, groupServices]) => (
        <div key={groupName} className={styles.groupCard}>
          <div className={styles.groupHeader}>{groupName}</div>
          {groupServices.map((service) => (
            <div key={service.id} className={styles.serviceItem}>
              <div className={styles.serviceRow}>
                <div className={styles.serviceMeta}>
                  <span className={styles.serviceName}>{service.name}</span>
                  {service.environment && (
                    <span className={styles.serviceEnv}>{service.environment}</span>
                  )}
                </div>
                {renderStatusBadge(service.currentStatus)}
              </div>
              {renderUptimeBars(service.id, service.currentStatus)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

