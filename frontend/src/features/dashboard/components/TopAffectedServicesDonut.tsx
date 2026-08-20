import styles from './TopAffectedServicesDonut.module.css';

export function TopAffectedServicesDonut() {
  // Breakdown of incidents across services
  // TODO: wire to real API once backend exposes per-service incident aggregation
  const servicesData = [
    { name: 'API Gateway', count: 8, pct: 33, color: '#EF4444' },
    { name: 'Payment Service', count: 6, pct: 25, color: '#F97316' },
    { name: 'User Service', count: 5, pct: 21, color: '#22C55E' },
    { name: 'Inventory Service', count: 3, pct: 13, color: '#EAB308' },
    { name: 'Other Services', count: 2, pct: 8, color: '#94A3B8' },
  ];

  const totalIncidents = servicesData.reduce((acc, curr) => acc + curr.count, 0);

  // Calculate SVG stroke-dasharray and stroke-dashoffset for a circle with radius 38 (circumference ~ 238.76)
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Top Affected Services</h2>
      </div>

      <div className={styles.content}>
        {/* Donut Chart SVG with Center Text */}
        <div className={styles.donutWrap}>
          <svg className={styles.donutSvg} viewBox="0 0 100 100">
            {servicesData.map((item, idx) => {
              const strokeLength = (item.pct / 100) * circumference;
              const strokeOffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += item.pct;

              return (
                <circle
                  key={idx}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="14"
                  strokeDasharray={`${strokeLength} ${circumference - strokeLength}`}
                  strokeDashoffset={strokeOffset}
                  transform="rotate(-90 50 50)"
                />
              );
            })}
          </svg>

          <div className={styles.donutCenter}>
            <span className={styles.centerNumber}>{totalIncidents}</span>
            <span className={styles.centerLabel}>Incidents</span>
          </div>
        </div>

        {/* Legend List on Right */}
        <div className={styles.legendList}>
          {servicesData.map((item) => (
            <div key={item.name} className={styles.legendRow}>
              <div className={styles.legendItemLeft}>
                <span className={styles.dot} style={{ backgroundColor: item.color }} />
                <span className={styles.itemName}>{item.name}</span>
              </div>
              <span className={styles.itemCount}>
                {item.count} ({item.pct}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
