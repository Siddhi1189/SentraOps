import styles from './SystemHealthOverview.module.css';

export function SystemHealthOverview() {
  // System components health summary
  // TODO: wire to real API once backend exposes subsystem categorization metrics
  const healthMetrics = [
    {
      name: 'HTTP Services',
      healthy: 248,
      total: 250,
      pct: 99.2,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      ),
    },
    {
      name: 'Database',
      healthy: 18,
      total: 20,
      pct: 90.0,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8A33D" strokeWidth="2">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      ),
    },
    {
      name: 'Background Jobs',
      healthy: 156,
      total: 160,
      pct: 97.5,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
    },
    {
      name: 'Cron Jobs',
      healthy: 32,
      total: 35,
      pct: 91.4,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9333EA" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <h2 className={styles.sectionTitle}>System Health Overview</h2>

      <div className={styles.grid}>
        {healthMetrics.map((item) => (
          <div key={item.name} className={styles.healthCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <span className={styles.iconWrap}>{item.icon}</span>
                <span className={styles.cardName}>{item.name}</span>
              </div>
              <span className={styles.pctText}>{item.pct}%</span>
            </div>

            <div className={styles.metricRow}>
              <span className={styles.counts}>
                {item.healthy} / {item.total} Healthy
              </span>
            </div>

            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${item.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
