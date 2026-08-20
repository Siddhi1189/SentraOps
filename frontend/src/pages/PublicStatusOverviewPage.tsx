import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usePublicStatusOverviewQuery } from '../features/status-page/hooks/usePublicStatus';
import { PublicStatusLayout } from '../features/status-page/components/PublicStatusLayout';
import { OverallStatusBanner, computeAggregateStatus } from '../features/status-page/components/OverallStatusBanner';
import { PublicServiceList } from '../features/status-page/components/PublicServiceList';
import { PublicIncidentHistory } from '../features/status-page/components/PublicIncidentHistory';
import { PublicMaintenanceSchedule } from '../features/status-page/components/PublicMaintenanceSchedule';
import { StatusNotFound } from '../features/status-page/components/StatusNotFound';
import { Spinner } from '../components/ui/Spinner/Spinner';
import type { ApiError } from '../types/api';

export function PublicStatusOverviewPage() {
  const { orgSlug = '' } = useParams<{ orgSlug: string }>();
  const { data: overviewRes, isLoading, isError, error, refetch } = usePublicStatusOverviewQuery(orgSlug);

  const overviewData = overviewRes?.data;

  useEffect(() => {
    if (overviewData) {
      const orgName = overviewData.settings?.companyName || overviewData.settings?.organization?.name || orgSlug;
      const aggStatus = computeAggregateStatus(overviewData.services || []);
      const statusText = {
        up: 'All Systems Operational',
        degraded: 'Partial Degradation Detected',
        down: 'Major Outage Detected',
      }[aggStatus];

      document.title = `${orgName} — ${statusText}`;
    }
  }, [overviewData, orgSlug]);

  if (isLoading) {
    return (
      <PublicStatusLayout orgSlug={orgSlug}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <Spinner size="lg" />
        </div>
      </PublicStatusLayout>
    );
  }

  // Handle 404 (invalid slug) vs transient error
  const apiError = error ? (error as unknown as ApiError) : undefined;
  if (isError && (apiError?.status === 404 || apiError?.error?.code === 'NOT_FOUND')) {
    return <StatusNotFound />;
  }

  if (isError || !overviewData) {
    return (
      <PublicStatusLayout orgSlug={orgSlug}>
        <div
          style={{
            textAlign: 'center',
            padding: '32px 24px',
            backgroundColor: 'var(--color-bg-surface, #ffffff)',
            borderRadius: '8px',
            border: '1px solid var(--color-border, #e2e8f0)',
          }}
        >
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.125rem' }}>Unable to Load Status</h3>
          <p style={{ margin: '0 0 16px 0', color: 'var(--color-text-muted, #64748b)', fontSize: '0.875rem' }}>
            {apiError?.error?.message || 'Failed to retrieve system status overview.'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--color-primary, #2563eb)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      </PublicStatusLayout>
    );
  }

  const { settings, services, openIncidents, maintenance } = overviewData;

  return (
    <PublicStatusLayout orgSlug={orgSlug} settings={settings}>
      <OverallStatusBanner services={services || []} />
      <PublicServiceList services={services || []} />

      {openIncidents && openIncidents.length > 0 && (
        <PublicIncidentHistory
          incidents={openIncidents}
          title="Active Incidents"
          emptyMessage="No active incidents reported."
        />
      )}

      <PublicMaintenanceSchedule
        maintenance={maintenance || []}
        title="Scheduled Maintenance"
        omitIfEmpty
      />
    </PublicStatusLayout>
  );
}
