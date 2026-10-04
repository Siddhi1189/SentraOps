import React, { useState } from 'react';
import type { Service } from '../../../types/domain';
import { useServicePerformanceQuery } from '../../analytics/hooks/useAnalytics';
import styles from './ServicePerformanceSection.module.css';

export interface ServicePerformanceSectionProps {
  service: Service;
}

export function ServicePerformanceSection({ service }: ServicePerformanceSectionProps) {
  const { data: res, isLoading, isError } = useServicePerformanceQuery(service.id);
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    latency: number;
    time: string;
  } | null>(null);

  const perf = res?.data;
  const windows = perf?.windows;
  const timeSeries = perf?.timeSeries || [];
  const ssl = perf?.ssl;

  const w24h = windows?.['24h'];
  const w7d = windows?.['7d'];
  const w30d = windows?.['30d'];

  // Check if this is an HTTPS endpoint eligible for SSL monitoring
  const isHttps = service.url ? service.url.toLowerCase().startsWith('https://') : false;
  const showSsl = service.monitorType === 'http' && isHttps;

  // Chart coordinate calculations
  const chartWidth = 650;
  const chartHeight = 150;
  const paddingX = 30;
  const paddingY = 20;
  const plotWidth = chartWidth - paddingX * 2;
  const plotHeight = chartHeight - paddingY * 2;

  const points = timeSeries.map((p) => p.responseTimeMs || 0);
  const maxLatency = Math.max(...points, 50, w24h?.p95 || 0);
  const p95Val = w24h?.p95 || 0;

  const getY = (val: number) => {
    return chartHeight - paddingY - (val / (maxLatency || 1)) * plotHeight;
  };

  const getX = (index: number) => {
    if (timeSeries.length <= 1) return paddingX + plotWidth / 2;
    return paddingX + (index / (timeSeries.length - 1)) * plotWidth;
  };

  const coords = timeSeries.map((p, idx) => ({
    x: getX(idx),
    y: getY(p.responseTimeMs || 0),
    latency: p.responseTimeMs || 0,
    time: new Date(p.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));

  const polylinePoints = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const polygonPoints = coords.length > 0
    ? `${paddingX},${chartHeight - paddingY} ${polylinePoints} ${coords[coords.length - 1].x.toFixed(1)},${chartHeight - paddingY}`
    : '';

  const p95Y = getY(p95Val);

  return (
    <div className={styles.container} data-testid="service-performance-section">
      {/* 1. Uptime Summary Row (24h / 7d / 30d) */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <h5 className={styles.cardTitle}>Last 24 Hours</h5>
            <span className={styles.totalChecks}>
              {w24h?.totalChecks ?? 0} checks
            </span>
          </div>
          <div className={styles.uptimeRow}>
            <span className={styles.uptimeValue}>
              {w24h?.totalChecks ? `${w24h.uptimePercentage.toFixed(2)}%` : '100%'}
            </span>
            <span className={styles.uptimeLabel}>Uptime</span>
          </div>
          <div className={styles.percentilesList}>
            <div className={styles.percentileItem}>
              <span className={styles.pctLabel}>p50</span>
              <span className={styles.pctVal}>{w24h?.p50 ?? 0}ms</span>
            </div>
            <div className={styles.percentileItem}>
              <span className={styles.pctLabel}>p95</span>
              <span className={styles.pctVal}>{w24h?.p95 ?? 0}ms</span>
            </div>
            <div className={styles.percentileItem}>
              <span className={styles.pctLabel}>p99</span>
              <span className={styles.pctVal}>{w24h?.p99 ?? 0}ms</span>
            </div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <h5 className={styles.cardTitle}>Last 7 Days</h5>
            <span className={styles.totalChecks}>
              {w7d?.totalChecks ?? 0} checks
            </span>
          </div>
          <div className={styles.uptimeRow}>
            <span className={styles.uptimeValue}>
              {w7d?.totalChecks ? `${w7d.uptimePercentage.toFixed(2)}%` : '100%'}
            </span>
            <span className={styles.uptimeLabel}>Uptime</span>
          </div>
          <div className={styles.percentilesList}>
            <div className={styles.percentileItem}>
              <span className={styles.pctLabel}>p50</span>
              <span className={styles.pctVal}>{w7d?.p50 ?? 0}ms</span>
            </div>
            <div className={styles.percentileItem}>
              <span className={styles.pctLabel}>p95</span>
              <span className={styles.pctVal}>{w7d?.p95 ?? 0}ms</span>
            </div>
            <div className={styles.percentileItem}>
              <span className={styles.pctLabel}>p99</span>
              <span className={styles.pctVal}>{w7d?.p99 ?? 0}ms</span>
            </div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <h5 className={styles.cardTitle}>Last 30 Days</h5>
            <span className={styles.totalChecks}>
              {w30d?.totalChecks ?? 0} checks
            </span>
          </div>
          <div className={styles.uptimeRow}>
            <span className={styles.uptimeValue}>
              {w30d?.totalChecks ? `${w30d.uptimePercentage.toFixed(2)}%` : '100%'}
            </span>
            <span className={styles.uptimeLabel}>Uptime</span>
          </div>
          <div className={styles.percentilesList}>
            <div className={styles.percentileItem}>
              <span className={styles.pctLabel}>p50</span>
              <span className={styles.pctVal}>{w30d?.p50 ?? 0}ms</span>
            </div>
            <div className={styles.percentileItem}>
              <span className={styles.pctLabel}>p95</span>
              <span className={styles.pctVal}>{w30d?.p95 ?? 0}ms</span>
            </div>
            <div className={styles.percentileItem}>
              <span className={styles.pctLabel}>p99</span>
              <span className={styles.pctVal}>{w30d?.p99 ?? 0}ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Response-Time Chart with p95 Band */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h4 className={styles.chartTitle}>Response-Time Telemetry</h4>
          <div className={styles.chartLegend}>
            <div className={styles.legendItem}>
              <div className={styles.legendLine} />
              <span>Latency (ms)</span>
            </div>
            {p95Val > 0 && (
              <div className={styles.legendItem}>
                <div className={styles.legendP95} />
                <span>p95 Band ({p95Val}ms)</span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.svgWrapper}>
          {timeSeries.length === 0 ? (
            <div className={styles.chartEmpty}>
              Telemetry data will appear as health checks execute.
            </div>
          ) : (
            <svg
              className={styles.svgChart}
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              preserveAspectRatio="none"
              aria-label="Service response time chart"
            >
              <defs>
                <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line
                x1={paddingX}
                y1={chartHeight - paddingY}
                x2={chartWidth - paddingX}
                y2={chartHeight - paddingY}
                stroke="#E2E8F0"
                strokeWidth="1"
              />
              <line
                x1={paddingX}
                y1={paddingY}
                x2={chartWidth - paddingX}
                y2={paddingY}
                stroke="#E2E8F0"
                strokeWidth="1"
                strokeDasharray="4 4"
              />

              {/* p95 Translucent Band and Line */}
              {p95Val > 0 && (
                <>
                  <rect
                    x={paddingX}
                    y={Math.max(paddingY, p95Y)}
                    width={plotWidth}
                    height={Math.max(0, chartHeight - paddingY - p95Y)}
                    fill="#F59E0B"
                    fillOpacity="0.05"
                  />
                  <line
                    x1={paddingX}
                    y1={p95Y}
                    x2={chartWidth - paddingX}
                    y2={p95Y}
                    stroke="#F59E0B"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={chartWidth - paddingX - 4}
                    y={Math.max(paddingY + 12, p95Y - 4)}
                    fill="#D97706"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    p95: {p95Val}ms
                  </text>
                </>
              )}

              {/* Shaded Area */}
              {polygonPoints && (
                <polygon points={polygonPoints} fill="url(#latencyGradient)" />
              )}

              {/* Latency Polyline */}
              <polyline
                points={polylinePoints}
                fill="none"
                stroke="#2563EB"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {coords.map((c, i) => (
                <circle
                  key={i}
                  cx={c.x}
                  cy={c.y}
                  r="3"
                  fill="#FFFFFF"
                  stroke="#2563EB"
                  strokeWidth="1.5"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredPoint(c)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}

              {/* Hover Tooltip */}
              {hoveredPoint && (
                <g transform={`translate(${hoveredPoint.x}, ${hoveredPoint.y - 30})`}>
                  <rect
                    x="-40"
                    y="-10"
                    width="80"
                    height="24"
                    rx="4"
                    fill="#1E293B"
                    opacity="0.9"
                  />
                  <text
                    x="0"
                    y="6"
                    fill="#FFFFFF"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {hoveredPoint.latency}ms ({hoveredPoint.time})
                  </text>
                </g>
              )}
            </svg>
          )}
        </div>
      </div>

      {/* 3. SSL Days-Remaining Indicator */}
      {showSsl && (
        <div className={styles.sslCard} data-testid="ssl-indicator">
          <div className={styles.sslLeft}>
            <svg
              className={styles.sslIcon}
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <div className={styles.sslText}>
              <span className={styles.sslTitle}>SSL / TLS Certificate Status</span>
              <span className={styles.sslMeta}>
                {ssl?.checkedAt
                  ? `Last verified ${new Date(ssl.checkedAt).toLocaleDateString()} at ${new Date(
                      ssl.checkedAt
                    ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Automated HTTPS certificate expiry monitoring'}
              </span>
            </div>
          </div>

          <div>
            {ssl && typeof ssl.daysRemaining === 'number' ? (
              <span
                className={`${styles.sslBadge} ${
                  ssl.daysRemaining > 30
                    ? styles.sslValid
                    : ssl.daysRemaining >= 7
                    ? styles.sslWarning
                    : styles.sslDanger
                }`}
              >
                {ssl.daysRemaining > 0
                  ? `${ssl.daysRemaining} days remaining`
                  : 'Certificate Expired'}
              </span>
            ) : (
              <span className={`${styles.sslBadge} ${styles.sslValid}`}>
                SSL Monitoring Active
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
