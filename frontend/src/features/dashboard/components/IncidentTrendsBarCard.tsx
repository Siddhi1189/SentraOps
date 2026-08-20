import styles from './IncidentTrendsBarCard.module.css';

export function IncidentTrendsBarCard() {
  // Daily incident trend data Mon - Sun
  // TODO: wire to real API once backend exposes daily incident trend endpoint
  const dailyTrends = [
    { day: 'Mon', count: 2, isMax: false },
    { day: 'Tue', count: 5, isMax: false },
    { day: 'Wed', count: 3, isMax: false },
    { day: 'Thu', count: 7, isMax: false },
    { day: 'Fri', count: 12, isMax: true },
    { day: 'Sat', count: 4, isMax: false },
    { day: 'Sun', count: 1, isMax: false },
  ];

  const maxCount = 14;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Incident Trends</h2>
        <div className={styles.timeDropdown}>
          <span>This Week</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      <div className={styles.barsContainer}>
        {dailyTrends.map((item) => {
          const heightPct = Math.round((item.count / maxCount) * 100);

          return (
            <div key={item.day} className={styles.barCol}>
              <span className={styles.barValue}>{item.count}</span>
              <div className={styles.barTrack}>
                <div
                  className={`${styles.barFill} ${item.isMax ? styles.barFillActive : ''}`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              <span className={styles.dayLabel}>{item.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
