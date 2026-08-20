import { useState } from 'react';
import type { IncidentStatus, IncidentSeverity } from '../../../types/domain';
import { PageHeader } from '../../../components/ui/PageHeader/PageHeader';
import { Spinner } from '../../../components/ui/Spinner/Spinner';
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState';
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState';
import { Button } from '../../../components/ui/Button/Button';
import { IncidentsTable } from './IncidentsTable';
import { IncidentFilters } from './IncidentFilters';
import { useIncidentsQuery } from '../hooks/useIncidents';
import { useServicesQuery } from '../../services/hooks/useServices';

export function IncidentsView() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const [status, setStatus] = useState<IncidentStatus | ''>('');
  const [severity, setSeverity] = useState<IncidentSeverity | ''>('');
  const [serviceId, setServiceId] = useState<string>('');

  const queryParams = {
    page,
    limit,
    status: status || undefined,
    severity: severity || undefined,
    serviceId: serviceId || undefined,
  };

  const { data: incidentsData, isLoading, isError, error, refetch } = useIncidentsQuery(queryParams);
  const { data: servicesData } = useServicesQuery({ page: 1, limit: 100 });

  const servicesList = servicesData?.data || [];
  const incidents = incidentsData?.data || [];
  const total = incidentsData?.pagination?.total || 0;

  const hasActiveFilters = !!status || !!severity || !!serviceId;

  const handleClearFilters = () => {
    setStatus('');
    setSeverity('');
    setServiceId('');
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Incidents"
        description="Incident lifecycle management, timelines, and resolution tracking."
      />

      <IncidentFilters
        status={status}
        severity={severity}
        serviceId={serviceId}
        services={servicesList}
        onStatusChange={(s) => {
          setStatus(s);
          setPage(1);
        }}
        onSeverityChange={(sev) => {
          setSeverity(sev);
          setPage(1);
        }}
        onServiceIdChange={(id) => {
          setServiceId(id);
          setPage(1);
        }}
        onClearFilters={handleClearFilters}
      />

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Failed to Load Incidents"
          message={error instanceof Error ? error.message : 'Network error occurred'}
          onRetry={refetch}
        />
      ) : incidents.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            title="No Incidents Found"
            description="No incidents match these filters."
            action={
              <Button type="button" variant="secondary" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="No Incidents Recorded"
            description="No incidents recorded — that's a good sign."
          />
        )
      ) : (
        <IncidentsTable
          incidents={incidents}
          page={page}
          limit={limit}
          total={total}
          onPageChange={(newPage) => setPage(newPage)}
        />
      )}
    </div>
  );
}
