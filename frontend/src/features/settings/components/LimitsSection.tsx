import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../../api/client';
import type { ApiSuccess } from '../../../types/api';
import styles from './LimitsSection.module.css';

interface LimitsData {
  limits: {
    projects: { max: number; description: string };
    monitors: { max: number; description: string };
    ingestEventsPerMinutePerKey: { max: number; description: string };
    minCheckIntervalSeconds: { min: number; description: string };
    maxAssertionsPerMonitor: { max: number; description: string };
    dataRetentionDays: { health_checks: number; error_events: number; notifications: number };
  };
  supported: {
    monitorTypes: string[];
    assertionKinds: string[];
    notificationChannels: string[];
    incidentSeverities: string[];
  };
  notSupported: string[];
  usage: {
    projects: { current: number; max: number };
    monitors: { current: number; max: number };
  };
}

function UsageBar({ current, max }: { current: number; max: number }) {
  const pct = Math.min((current / max) * 100, 100);
  const color = pct >= 90 ? 'var(--color-status-down)' : pct >= 70 ? 'var(--color-status-degraded)' : 'var(--color-status-healthy)';
  return (
    <div className={styles.usageWrapper}>
      <div className={styles.usageBarTrack}>
        <div className={styles.usageBarFill} style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className={styles.usageText}>
        {current} / {max}
      </span>
    </div>
  );
}

export function LimitsSection() {
  const { data, isLoading, error } = useQuery<ApiSuccess<LimitsData>>({
    queryKey: ['limits'],
    queryFn: () => apiRequest<LimitsData>('/limits').then((r) => r),
    staleTime: 60_000,
  });

  const limitsData = data?.data;

  if (isLoading) {
    return <div className={styles.loading}>Loading limits…</div>;
  }
  if (error || !limitsData) {
    return <div className={styles.error}>Failed to load limits.</div>;
  }

  return (
    <div className={styles.container}>
      <div>
        <h1 className={styles.headerTitle}>Limits &amp; Supported Features</h1>
        <p className={styles.headerDesc}>Current usage and plan quotas for your organization.</p>
      </div>

      {/* Current Usage */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Current Usage</h2>
        <div>
          <div className={styles.row}>
            <span className={styles.label}>Projects</span>
            <div style={{ flex: 1, maxWidth: 220 }}>
              <UsageBar current={limitsData.usage.projects.current} max={limitsData.usage.projects.max} />
            </div>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Monitors</span>
            <div style={{ flex: 1, maxWidth: 220 }}>
              <UsageBar current={limitsData.usage.monitors.current} max={limitsData.usage.monitors.max} />
            </div>
          </div>
        </div>
      </div>

      {/* Plan Quotas */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Plan Quotas</h2>
        {[
          { label: 'Max Projects', value: `${limitsData.limits.projects.max} per organization` },
          { label: 'Max Monitors', value: `${limitsData.limits.monitors.max} per organization` },
          { label: 'Ingest Rate Limit', value: `${limitsData.limits.ingestEventsPerMinutePerKey.max} events / min / API key` },
          { label: 'Min Check Interval', value: `${limitsData.limits.minCheckIntervalSeconds.min} seconds` },
          { label: 'Max Assertions / Monitor', value: `${limitsData.limits.maxAssertionsPerMonitor.max}` },
          { label: 'Health Check Retention', value: `${limitsData.limits.dataRetentionDays.health_checks} days` },
          { label: 'Error Event Retention', value: `${limitsData.limits.dataRetentionDays.error_events} days` },
        ].map((item) => (
          <div key={item.label} className={styles.row}>
            <span className={styles.label}>{item.label}</span>
            <span className={styles.value}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Supported Monitor Types */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Supported Monitor Types</h2>
        <div className={styles.chipList}>
          {limitsData.supported.monitorTypes.map((t) => (
            <span key={t} className={styles.chip}>{t}</span>
          ))}
        </div>
        <h3 className={styles.subTitle}>Supported Assertion Kinds</h3>
        <div className={styles.chipList}>
          {limitsData.supported.assertionKinds.map((k) => (
            <span key={k} className={styles.chip}>{k}</span>
          ))}
        </div>
        <h3 className={styles.subTitle}>Supported Notification Channels</h3>
        <div className={styles.chipList}>
          {limitsData.supported.notificationChannels.map((c) => (
            <span key={c} className={styles.chip}>{c}</span>
          ))}
        </div>
      </div>

      {/* Not Supported */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Not Supported Yet</h2>
        <ul className={styles.unsupportedList}>
          {limitsData.notSupported.map((item) => (
            <li key={item} className={styles.unsupportedItem}>
              <span className={styles.crossMark}>✗</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
