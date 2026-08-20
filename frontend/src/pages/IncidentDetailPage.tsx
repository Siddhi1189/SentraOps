import { useParams } from 'react-router-dom';
import { IncidentDetailView } from '../features/incidents/components/IncidentDetailView';

export function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <IncidentDetailView incidentId={id || ''} />;
}
