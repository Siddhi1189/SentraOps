import type { StatusPageService } from '../../../api/status';
import styles from './PublicServiceList.module.css';

export interface PublicServiceListProps {
  services: StatusPageService[];
}

export function PublicServiceList({ services }: PublicServiceListProps) {
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

  if (!hasGroups) {
    // Render flat list
    return (
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Services Status</h3>
        <div className={styles.groupCard}>
          {services.map((service) => (
            <div key={service.id} className={styles.serviceRow}>
              <div className={styles.serviceMeta}>
                <span className={styles.serviceName}>{service.name}</span>
                {service.environment && (
                  <span className={styles.serviceEnv}>{service.environment}</span>
                )}
              </div>
              {renderStatusBadge(service.currentStatus)}
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
            <div key={service.id} className={styles.serviceRow}>
              <div className={styles.serviceMeta}>
                <span className={styles.serviceName}>{service.name}</span>
                {service.environment && (
                  <span className={styles.serviceEnv}>{service.environment}</span>
                )}
              </div>
              {renderStatusBadge(service.currentStatus)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
