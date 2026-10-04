import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../../api/client';


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
  const color = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#22c55e';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ flex: 1, height: 6, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: '0.8rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
        {current} / {max}
      </span>
    </div>
  );
}

import type { ApiSuccess } from '../../../types/api';

export function LimitsSection() {
  const { data, isLoading, error } = useQuery<ApiSuccess<LimitsData>>({

    queryKey: ['limits'],
    queryFn: () => apiRequest<LimitsData>('/limits').then((r) => r),

    staleTime: 60_000,
  });

  const limitsData = data?.data;


  const card: React.CSSProperties = {
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: 12,
    padding: '1.5rem',
    marginBottom: '1.5rem',
  };

  const heading2: React.CSSProperties = {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#e2e8f0',
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid #1e293b',
  };

  const row: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '0.6rem 0',
    borderBottom: '1px solid #1e2940',
    gap: '1rem',
  };

  const badge = (text: string, color = '#6366f1') => (
    <span style={{ background: `${color}22`, color, border: `1px solid ${color}44`, borderRadius: 6, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 600 }}>
      {text}
    </span>
  );

  if (isLoading) {
    return <div style={{ color: '#64748b', padding: '2rem' }}>Loading limits…</div>;
  }
  if (error || !limitsData) {
    return <div style={{ color: '#ef4444', padding: '2rem' }}>Failed to load limits.</div>;
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: '#e2e8f0', maxWidth: 700 }}>
      <h1 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>Limits &amp; Supported Features</h1>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem' }}>Current usage and plan quotas for your organization.</p>

      {/* Current Usage */}
      <div style={card}>
        <h2 style={heading2}>Current Usage</h2>
        <div>
          <div style={{ ...row }}>
            <span style={{ color: '#94a3b8' }}>Projects</span>
            <div style={{ flex: 1, maxWidth: 220 }}>
              <UsageBar current={limitsData.usage.projects.current} max={limitsData.usage.projects.max} />
            </div>
          </div>
          <div style={{ ...row, borderBottom: 'none' }}>
            <span style={{ color: '#94a3b8' }}>Monitors</span>
            <div style={{ flex: 1, maxWidth: 220 }}>
              <UsageBar current={limitsData.usage.monitors.current} max={limitsData.usage.monitors.max} />
            </div>
          </div>
        </div>
      </div>

      {/* Plan Quotas */}
      <div style={card}>
        <h2 style={heading2}>Plan Quotas</h2>
        {[
          { label: 'Max Projects', value: `${limitsData.limits.projects.max} per organization` },
          { label: 'Max Monitors', value: `${limitsData.limits.monitors.max} per organization` },
          { label: 'Ingest Rate Limit', value: `${limitsData.limits.ingestEventsPerMinutePerKey.max} events / min / API key` },
          { label: 'Min Check Interval', value: `${limitsData.limits.minCheckIntervalSeconds.min} seconds` },
          { label: 'Max Assertions / Monitor', value: `${limitsData.limits.maxAssertionsPerMonitor.max}` },
          { label: 'Health Check Retention', value: `${limitsData.limits.dataRetentionDays.health_checks} days` },
          { label: 'Error Event Retention', value: `${limitsData.limits.dataRetentionDays.error_events} days` },
        ].map((item, i, arr) => (
          <div key={item.label} style={{ ...row, borderBottom: i < arr.length - 1 ? '1px solid #1e2940' : 'none' }}>
            <span style={{ color: '#94a3b8' }}>{item.label}</span>
            <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Supported Monitor Types */}
      <div style={card}>
        <h2 style={heading2}>Supported Monitor Types</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {limitsData.supported.monitorTypes.map((t) => badge(t))}
        </div>
        <h2 style={{ ...heading2, marginTop: '1.5rem' }}>Supported Assertion Kinds</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {limitsData.supported.assertionKinds.map((k) => badge(k, '#0ea5e9'))}
        </div>
        <h2 style={{ ...heading2, marginTop: '1.5rem' }}>Supported Notification Channels</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {limitsData.supported.notificationChannels.map((c) => badge(c, '#22c55e'))}
        </div>
      </div>

      {/* Not Supported */}
      <div style={card}>
        <h2 style={heading2}>Not Supported Yet</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {limitsData.notSupported.map((item) => (
            <li key={item} style={{ ...row, gap: '0.5rem', borderBottom: '1px solid #1e2940' }}>
              <span style={{ color: '#ef4444', fontWeight: 700 }}>✗</span>
              <span style={{ color: '#64748b' }}>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
