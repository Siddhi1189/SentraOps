import styles from './UptimeLineChartCard.module.css';

export function UptimeLineChartCard() {
  // 30-day uptime telemetry points
  // TODO: wire to real API once backend exposes 30-day continuous time-series endpoint
  const points = [
    { date: 'May 1', val: 99.98, x: 40, y: 35 },
    { date: 'May 5', val: 99.95, x: 90, y: 45 },
    { date: 'May 8', val: 99.40, x: 140, y: 110 },
    { date: 'May 12', val: 99.85, x: 190, y: 55 },
    { date: 'May 15', val: 99.92, x: 240, y: 40 },
    { date: 'May 19', val: 98.20, x: 290, y: 140 },
    { date: 'May 22', val: 99.80, x: 340, y: 60 },
    { date: 'May 26', val: 99.95, x: 390, y: 38 },
    { date: 'May 29', val: 99.99, x: 440, y: 30 },
  ];

  const polylineStr = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPolygonStr = `40,160 ${polylineStr} 440,160`;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Service Uptime (Last 30 Days)</h2>
        <div className={styles.legend}>
          <span className={styles.legendDot} />
          <span className={styles.legendText}>Uptime %</span>
        </div>
      </div>

      <div className={styles.chartContainer}>
        {/* Y Axis labels */}
        <div className={styles.yAxis}>
          <span>100%</span>
          <span>99%</span>
          <span>98%</span>
          <span>97%</span>
          <span>96%</span>
        </div>

        {/* SVG Chart Area */}
        <div className={styles.svgWrap}>
          <svg className={styles.chartSvg} viewBox="0 0 480 180" preserveAspectRatio="none">
            <defs>
              <linearGradient id="uptimeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <line x1="40" y1="30" x2="460" y2="30" stroke="#F1F5F9" strokeWidth="1" />
            <line x1="40" y1="62" x2="460" y2="62" stroke="#F1F5F9" strokeWidth="1" />
            <line x1="40" y1="95" x2="460" y2="95" stroke="#F1F5F9" strokeWidth="1" />
            <line x1="40" y1="127" x2="460" y2="127" stroke="#F1F5F9" strokeWidth="1" />
            <line x1="40" y1="160" x2="460" y2="160" stroke="#F1F5F9" strokeWidth="1" />

            {/* Gradient fill underneath curve */}
            <polygon points={areaPolygonStr} fill="url(#uptimeGrad)" />

            {/* Line curve */}
            <polyline
              points={polylineStr}
              fill="none"
              stroke="#2563EB"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data point dots */}
            {points.map((p, idx) => (
              <circle
                key={idx}
                cx={p.x}
                cy={p.y}
                r="3.5"
                fill="#FFFFFF"
                stroke="#2563EB"
                strokeWidth="2"
              />
            ))}
          </svg>

          {/* X Axis dates */}
          <div className={styles.xAxis}>
            <span>May 1</span>
            <span>May 8</span>
            <span>May 15</span>
            <span>May 22</span>
            <span>May 29</span>
          </div>
        </div>
      </div>
    </div>
  );
}
