import styles from './AlertsSummaryCard.module.css';

export function AlertsSummaryCard() {
  // Weekly alert totals by severity level
  // TODO: wire to real API once backend exposes weekly alert volume metrics
  const alertStats = [
    { label: 'Critical', count: 4, trend: '↓ 20%', isGood: true, badgeClass: styles.criticalBadge },
    { label: 'Major', count: 12, trend: '↑ 9%', isGood: false, badgeClass: styles.majorBadge },
    { label: 'Minor', count: 23, trend: '↓ 4%', isGood: true, badgeClass: styles.minorBadge },
    { label: 'Info', count: 45, trend: '↑ 12%', isGood: true, badgeClass: styles.infoBadge },
  ];

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Alerts Summary (This Week)</h2>
      </div>

      <div className={styles.tilesGrid}>
        {alertStats.map((item) => (
          <div key={item.label} className={styles.tile}>
            <div className={styles.tileHeader}>
              <span className={`${styles.badge} ${item.badgeClass}`}>{item.label}</span>
            </div>
            <div className={styles.tileCount}>{item.count}</div>
            <div className={item.isGood ? styles.trendGood : styles.trendWarn}>
              {item.trend}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
