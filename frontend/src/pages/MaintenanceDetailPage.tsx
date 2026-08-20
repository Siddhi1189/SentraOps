import { useParams } from 'react-router-dom';
import { MaintenanceDetailView } from '../features/maintenance/components/MaintenanceDetailView';

export function MaintenanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <MaintenanceDetailView windowId={id || ''} />;
}
