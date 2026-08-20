import { Breadcrumbs } from '../../../components/ui/Breadcrumbs/Breadcrumbs';
import { Spinner } from '../../../components/ui/Spinner/Spinner';
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState';
import { IncidentDetailHeader } from './IncidentDetailHeader';
import { IncidentUpdatePanel } from './IncidentUpdatePanel';
import { IncidentTimeline } from './IncidentTimeline';
import { useIncidentQuery, useIncidentTimelineQuery } from '../hooks/useIncidents';
import styles from './IncidentDetailView.module.css';

export interface IncidentDetailViewProps {
  incidentId: string;
}

export function IncidentDetailView({ incidentId }: IncidentDetailViewProps) {
  // Independent parallel data fetching
  const {
    data: incidentData,
    isLoading: isIncidentLoading,
    isError: isIncidentError,
    error: incidentError,
    refetch: refetchIncident,
  } = useIncidentQuery(incidentId);

  const {
    data: timelineData,
    isLoading: isTimelineLoading,
    refetch: refetchTimeline,
  } = useIncidentTimelineQuery(incidentId);

  const incident = incidentData?.data;
  const timelineEvents = timelineData?.data || [];

  const handleReloadAll = () => {
    refetchIncident();
    refetchTimeline();
  };

  if (isIncidentLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (isIncidentError || !incident) {
    return (
      <ErrorState
        title="Incident Not Found"
        message={
          incidentError instanceof Error ? incidentError.message : 'Incident details could not be loaded.'
        }
        onRetry={refetchIncident}
      />
    );
  }

  const breadcrumbs = [
    { label: 'Incidents', path: '/app/incidents' },
    { label: incident.title },
  ];

  return (
    <div>
      <Breadcrumbs items={breadcrumbs} />

      <IncidentDetailHeader incident={incident} />

      {/* Grid stacking single column < 1024px */}
      <div className={styles.layoutGrid}>
        <IncidentUpdatePanel incident={incident} onReload={handleReloadAll} />

        {isTimelineLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-6)' }}>
            <Spinner size="md" />
          </div>
        ) : (
          <IncidentTimeline events={timelineEvents} />
        )}
      </div>
    </div>
  );
}
