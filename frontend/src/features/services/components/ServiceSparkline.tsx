import React from 'react';

export interface ServiceSparklineProps {
  points?: number[];
  status?: string;
  width?: number;
  height?: number;
}

export function ServiceSparkline({
  points = [],
  status = 'up',
  width = 72,
  height = 18,
}: ServiceSparklineProps) {
  if (!points || points.length === 0) {
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
        aria-label="No telemetry data"
      >
        <line
          x1="2"
          y1={height / 2}
          x2={width - 2}
          y2={height / 2}
          stroke="var(--color-border, #cbd5e1)"
          strokeWidth="1.5"
          strokeDasharray="2,2"
        />
      </svg>
    );
  }

  const validPoints = points.map((p) => (typeof p === 'number' && !isNaN(p) ? p : 0));
  const max = Math.max(...validPoints, 10);
  const min = 0;
  const range = max - min || 1;

  const paddingX = 2;
  const paddingY = 2;
  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingY * 2;

  const coords = validPoints.map((val, idx) => {
    const x = paddingX + (idx / Math.max(validPoints.length - 1, 1)) * usableWidth;
    const y = height - paddingY - ((val - min) / range) * usableHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pointsString = coords.join(' ');

  const strokeColor =
    status === 'down'
      ? 'var(--color-danger, #ef4444)'
      : status === 'degraded'
      ? 'var(--color-warning, #f59e0b)'
      : 'var(--color-primary, #2563eb)';

  const lastPoint = coords[coords.length - 1]?.split(',') || [0, 0];
  const lastVal = validPoints[validPoints.length - 1];

  return (
    <div
      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
      title={`Recent latency: ${lastVal}ms (${validPoints.length} checks)`}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: 'block', overflow: 'visible' }}
        aria-label={`Latency sparkline: latest ${lastVal}ms`}
      >
        <polyline
          points={pointsString}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx={lastPoint[0]}
          cy={lastPoint[1]}
          r="2"
          fill={strokeColor}
        />
      </svg>
      <span
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '10px',
          color: 'var(--color-text-secondary, #64748b)',
        }}
      >
        {lastVal}ms
      </span>
    </div>
  );
}
