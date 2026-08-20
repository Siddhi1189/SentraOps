import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '../app/providers/SessionProvider';
import { can } from '../permissions/can';
import { Breadcrumbs } from '../components/ui/Breadcrumbs/Breadcrumbs';
import { PageHeader } from '../components/ui/PageHeader/PageHeader';
import { StatusChip } from '../components/ui/StatusChip/StatusChip';
import { Button } from '../components/ui/Button/Button';
import { Spinner } from '../components/ui/Spinner/Spinner';
import { ErrorState } from '../components/ui/ErrorState/ErrorState';
import { ServiceDetailTabs } from '../features/services/components/ServiceDetailTabs';
import { ServiceFormDrawer } from '../features/services/components/ServiceFormDrawer';
import { ConfirmDialog } from '../components/feedback/ConfirmDialog/ConfirmDialog';
import {
  useServiceQuery,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
} from '../features/services/hooks/useServices';

export function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSession();

  const canUpdate = can(user, 'service:update');
  const canDelete = can(user, 'service:delete');

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data: serviceData, isLoading, isError, error, refetch } = useServiceQuery(id || '');
  const updateServiceMutation = useUpdateServiceMutation();
  const deleteServiceMutation = useDeleteServiceMutation();

  const service = serviceData?.data;

  const handleEditSubmit = async (formData: any) => {
    if (id) {
      await updateServiceMutation.mutateAsync({ id, data: formData });
      setIsEditOpen(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (id) {
      await deleteServiceMutation.mutateAsync(id);
      setIsDeleteOpen(false);
      // Navigate back to /app/services after deletion
      navigate('/app/services');
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !service) {
    return (
      <ErrorState
        title="Service Not Found"
        message={error instanceof Error ? error.message : 'Service could not be retrieved.'}
        onRetry={refetch}
      />
    );
  }

  const breadcrumbs = [
    { label: 'Services', path: '/app/services' },
    { label: service.name },
  ];

  return (
    <div>
      <Breadcrumbs items={breadcrumbs} />

      <PageHeader
        title={service.name}
        description={`Target endpoint: ${service.url}`}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <StatusChip status={service.currentStatus} />
            {canUpdate && (
              <Button type="button" variant="secondary" onClick={() => setIsEditOpen(true)}>
                Edit
              </Button>
            )}
            {canDelete && (
              <Button type="button" variant="danger" onClick={() => setIsDeleteOpen(true)}>
                Delete
              </Button>
            )}
          </div>
        }
      />

      <ServiceDetailTabs service={service} />

      {/* Edit Drawer */}
      <ServiceFormDrawer
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleEditSubmit}
        initialService={service}
        isSubmitting={updateServiceMutation.isPending}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Service"
        message={`Are you sure you want to delete "${service.name}"? This action cannot be undone.`}
        confirmLabel="Delete Service"
        isLoading={deleteServiceMutation.isPending}
      />
    </div>
  );
}
