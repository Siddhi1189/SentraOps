import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Service, ServiceGroup, ServiceStatus } from '../types/domain';
import { useSession } from '../app/providers/SessionProvider';
import { can } from '../permissions/can';
import { PageHeader } from '../components/ui/PageHeader/PageHeader';
import { Button } from '../components/ui/Button/Button';
import { Input } from '../components/ui/Input/Input';
import { Select } from '../components/ui/Select/Select';
import { Spinner } from '../components/ui/Spinner/Spinner';
import { ErrorState } from '../components/ui/ErrorState/ErrorState';
import { EmptyState } from '../components/ui/EmptyState/EmptyState';
import { ServicesTable } from '../features/services/components/ServicesTable';
import { ServiceFormDrawer } from '../features/services/components/ServiceFormDrawer';
import { GroupsPanel } from '../features/services/components/GroupsPanel';
import { ConfirmDialog } from '../components/feedback/ConfirmDialog/ConfirmDialog';
import {
  useServicesQuery,
  useGroupsQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
} from '../features/services/hooks/useServices';

const validStatuses: ServiceStatus[] = ['up', 'down', 'degraded', 'maintenance', 'unknown'];

export function ServicesPage() {
  const { user } = useSession();
  const canCreate = can(user, 'service:create');
  const canManageGroups = can(user, 'group:manage');

  const [searchParams, setSearchParams] = useSearchParams();

  // Dynamically read & validate status parameter from current URL searchParams
  const urlStatus = searchParams.get('status');
  const clientStatusFilter =
    urlStatus && validStatuses.includes(urlStatus as ServiceStatus) ? urlStatus : '';

  const handleStatusChange = (newStatus: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (newStatus) {
      newParams.set('status', newStatus);
    } else {
      newParams.delete('status');
    }
    setSearchParams(newParams, { replace: true });
  };

  const [page, setPage] = useState(1);
  const limit = 10;
  const [search, setSearch] = useState('');
  const [groupId, setGroupId] = useState<string>('');

  const [isServiceDrawerOpen, setIsServiceDrawerOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isGroupsPanelOpen, setIsGroupsPanelOpen] = useState(false);
  const [deletingService, setDeletingService] = useState<Service | null>(null);

  // CRITICAL RULE: GET /services query parameters do NOT include status!
  const queryParams = {
    page,
    limit,
    search: search || undefined,
    groupId: groupId || undefined,
  };

  const { data: servicesData, isLoading, isError, error, refetch } = useServicesQuery(queryParams);
  const { data: groupsData } = useGroupsQuery({ limit: 50 });
  const groupsList = groupsData?.data || [];

  const createServiceMutation = useCreateServiceMutation();
  const updateServiceMutation = useUpdateServiceMutation();
  const deleteServiceMutation = useDeleteServiceMutation();

  const handleOpenCreate = () => {
    setEditingService(null);
    setIsServiceDrawerOpen(true);
  };

  const handleOpenEdit = (service: Service) => {
    setEditingService(service);
    setIsServiceDrawerOpen(true);
  };

  const handleServiceSubmit = async (formData: any) => {
    if (editingService) {
      await updateServiceMutation.mutateAsync({ id: editingService.id, data: formData });
    } else {
      await createServiceMutation.mutateAsync(formData);
    }
    setIsServiceDrawerOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (deletingService) {
      await deleteServiceMutation.mutateAsync(deletingService.id);
      setDeletingService(null);
    }
  };

  // Perform client-side status filtering over current page results only
  const allServicesOnPage = servicesData?.data || [];
  const displayedServices = clientStatusFilter
    ? allServicesOnPage.filter((s: Service) => s.currentStatus === (clientStatusFilter as ServiceStatus))
    : allServicesOnPage;

  const totalServices = servicesData?.pagination?.total || 0;

  return (
    <div>
      <PageHeader
        title="Services"
        description="Monitor operational status, endpoints, and dependencies across services."
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            {canManageGroups && (
              <Button type="button" variant="secondary" onClick={() => setIsGroupsPanelOpen(true)}>
                Manage Groups
              </Button>
            )}
            {canCreate && (
              <Button type="button" variant="primary" onClick={handleOpenCreate}>
                + Add Service
              </Button>
            )}
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'flex-end',
          marginBottom: '24px',
          backgroundColor: 'var(--color-bg-surface)',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ flex: '1 1 240px' }}>
          <Input
            label="Search Services"
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by service name or URL..."
          />
        </div>

        <div style={{ flex: '0 1 200px' }}>
          <Select
            label="Group Filter"
            value={groupId}
            onChange={(e) => {
              setGroupId(e.target.value);
              setPage(1);
            }}
            options={[
              { label: 'All Groups', value: '' },
              ...groupsList.map((g: ServiceGroup) => ({ label: g.name, value: g.id })),
            ]}
          />
        </div>

        <div style={{ flex: '0 1 240px' }}>
          <Select
            label="Status Filter"
            value={clientStatusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'UP', value: 'up' },
              { label: 'DOWN', value: 'down' },
              { label: 'DEGRADED', value: 'degraded' },
              { label: 'MAINTENANCE', value: 'maintenance' },
              { label: 'UNKNOWN', value: 'unknown' },
            ]}
          />
          <span
            style={{
              fontSize: '11px',
              color: 'var(--color-text-muted)',
              marginTop: '4px',
              display: 'block',
            }}
          >
            Status filter — current page only
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Failed to Load Services"
          message={error instanceof Error ? error.message : 'Network error occurred'}
          onRetry={refetch}
        />
      ) : displayedServices.length === 0 ? (
        <EmptyState
          title="No Services Found"
          description={
            canCreate
              ? 'No services match your filters. Click below to register a service.'
              : 'No services exist in your organization.'
          }
          action={
            canCreate ? (
              <Button type="button" variant="primary" onClick={handleOpenCreate}>
                + Add Service
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ServicesTable
          services={displayedServices}
          page={page}
          limit={limit}
          total={totalServices}
          onPageChange={(newPage) => setPage(newPage)}
          onEditService={handleOpenEdit}
          onDeleteService={(s) => setDeletingService(s)}
        />
      )}

      {/* Create / Edit Service Form Drawer */}
      <ServiceFormDrawer
        isOpen={isServiceDrawerOpen}
        onClose={() => setIsServiceDrawerOpen(false)}
        onSubmit={handleServiceSubmit}
        initialService={editingService}
        isSubmitting={createServiceMutation.isPending || updateServiceMutation.isPending}
      />

      {/* Service Groups Management Drawer */}
      <GroupsPanel isOpen={isGroupsPanelOpen} onClose={() => setIsGroupsPanelOpen(false)} />

      {/* Confirm Delete Service Dialog */}
      <ConfirmDialog
        isOpen={!!deletingService}
        onClose={() => setDeletingService(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Service"
        message={`Are you sure you want to delete "${deletingService?.name}"? All associated health check logs and monitoring configurations will be permanently removed.`}
        confirmLabel="Delete Service"
        isLoading={deleteServiceMutation.isPending}
      />
    </div>
  );
}
