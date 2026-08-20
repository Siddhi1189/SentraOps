import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  usePublicStatusMaintenanceQuery,
  usePublicStatusOverviewQuery,
} from '../features/status-page/hooks/usePublicStatus';
import { PublicStatusLayout } from '../features/status-page/components/PublicStatusLayout';
import { PublicMaintenanceSchedule } from '../features/status-page/components/PublicMaintenanceSchedule';
import { StatusNotFound } from '../features/status-page/components/StatusNotFound';
import { Spinner } from '../components/ui/Spinner/Spinner';
import type { ApiError } from '../types/api';

export function PublicStatusMaintenancePage() {
  const { orgSlug = '' } = useParams<{ orgSlug: string }>();
  const { data: maintenanceRes, isLoading, isError, error, refetch } = usePublicStatusMaintenanceQuery(orgSlug);
  const { data: overviewRes } = usePublicStatusOverviewQuery(orgSlug);

  const maintenance = maintenanceRes?.data?.maintenance || [];
  const settings = overviewRes?.data?.settings;

  useEffect(() => {
    const orgName = settings?.companyName || settings?.organization?.name || orgSlug;
    document.title = `${orgName} — Maintenance Schedule`;
  }, [settings, orgSlug]);

  if (isLoading) {
    return (
      <PublicStatusLayout orgSlug={orgSlug} settings={settings}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <Spinner size="lg" />
        </div>
      </PublicStatusLayout>
    );
  }

  const apiError = error ? (error as unknown as ApiError) : undefined;
  if (isError && (apiError?.status === 404 || apiError?.error?.code === 'NOT_FOUND')) {
    return <StatusNotFound />;
  }

  if (isError) {
    return (
      <PublicStatusLayout orgSlug={orgSlug} settings={settings}>
        <div
          style={{
            textAlign: 'center',
            padding: '32px 24px',
            backgroundColor: 'var(--color-bg-surface, #ffffff)',
            borderRadius: '8px',
            border: '1px solid var(--color-border, #e2e8f0)',
          }}
        >
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.125rem' }}>Unable to Load Maintenance Schedule</h3>
          <p style={{ margin: '0 0 16px 0', color: 'var(--color-text-muted, #64748b)', fontSize: '0.875rem' }}>
            {apiError?.error?.message || 'Failed to retrieve maintenance schedule.'}
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

  return (
    <PublicStatusLayout orgSlug={orgSlug} settings={settings}>
      <PublicMaintenanceSchedule
        maintenance={maintenance}
        title="Maintenance Schedule"
      />
    </PublicStatusLayout>
  );
}
