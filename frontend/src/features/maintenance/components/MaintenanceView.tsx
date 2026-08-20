import { useState } from 'react';
import type { MaintenanceStatus, MaintenanceWindow } from '../../../types/domain';
import { PageHeader } from '../../../components/ui/PageHeader/PageHeader';
import { Spinner } from '../../../components/ui/Spinner/Spinner';
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState';
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState';
import { Button } from '../../../components/ui/Button/Button';
import { Select } from '../../../components/ui/Select/Select';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog/ConfirmDialog';
import { MaintenanceTable } from './MaintenanceTable';
import { MaintenanceFormDrawer } from './MaintenanceFormDrawer';
import { useSession } from '../../../app/providers/SessionProvider';
import { can } from '../../../permissions/can';
import {
  useMaintenanceQuery,
  useDeleteMaintenanceMutation,
} from '../hooks/useMaintenance';

export function MaintenanceView() {
  const { user } = useSession();
  const canManage = can(user, 'maintenance:manage');

  const [page, setPage] = useState(1);
  const limit = 10;
  const [clientStatusFilter, setClientStatusFilter] = useState<MaintenanceStatus | ''>('');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedWindow, setSelectedWindow] = useState<MaintenanceWindow | null>(null);

  const [windowToDelete, setWindowToDelete] = useState<MaintenanceWindow | null>(null);

  // GET /maintenance accepts strictly page & limit — ZERO status/date filters sent to API
  const { data: maintenanceData, isLoading, isError, error, refetch } = useMaintenanceQuery({
    page,
    limit,
  });

  const deleteMutation = useDeleteMaintenanceMutation();

  const allWindowsOnPage = maintenanceData?.data || [];
  const total = maintenanceData?.pagination?.total || 0;

  // Filter client-side over currently loaded page only
  const displayedWindows = clientStatusFilter
    ? allWindowsOnPage.filter((w: MaintenanceWindow) => w.status === clientStatusFilter)
    : allWindowsOnPage;

  const handleOpenCreate = () => {
    setSelectedWindow(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (win: MaintenanceWindow) => {
    setSelectedWindow(win);
    setIsDrawerOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!windowToDelete) return;
    try {
      await deleteMutation.mutateAsync(windowToDelete.id);
      setWindowToDelete(null);
    } catch {
      // Handled in mutation onError toast
    }
  };

  return (
    <div>
      <PageHeader
        title="Maintenance Windows"
        description="Schedule and manage operational maintenance windows."
        actions={
          canManage ? (
            <Button type="button" variant="primary" onClick={handleOpenCreate}>
              + Schedule Maintenance
            </Button>
          ) : undefined
        }
      />

      <div style={{ marginBottom: 'var(--space-6)', maxWidth: '300px' }}>
        <Select
          label="Status filter — current page only"
          value={clientStatusFilter}
          onChange={(e) => setClientStatusFilter(e.target.value as MaintenanceStatus | '')}
          options={[
            { label: 'All Statuses', value: '' },
            { label: 'Scheduled', value: 'scheduled' },
            { label: 'In Progress', value: 'in_progress' },
            { label: 'Completed', value: 'completed' },
          ]}
        />
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Failed to Load Maintenance Windows"
          message={error instanceof Error ? error.message : 'Network error occurred'}
          onRetry={refetch}
        />
      ) : displayedWindows.length === 0 ? (
        <EmptyState
          title="No maintenance windows scheduled"
          description="There are currently no maintenance windows scheduled for your organization."
          action={
            canManage ? (
              <Button type="button" variant="primary" onClick={handleOpenCreate}>
                Add maintenance window
              </Button>
            ) : undefined
          }
        />
      ) : (
        <MaintenanceTable
          windows={displayedWindows}
          page={page}
          limit={limit}
          total={total}
          onPageChange={(newPage) => setPage(newPage)}
          onEdit={handleOpenEdit}
          onDelete={(win) => setWindowToDelete(win)}
        />
      )}

      {canManage && (
        <>
          <MaintenanceFormDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            maintenanceWindow={selectedWindow}
          />

          <ConfirmDialog
            isOpen={!!windowToDelete}
            onClose={() => setWindowToDelete(null)}
            onConfirm={handleConfirmDelete}
            title="Delete Maintenance Window"
            message={`Are you sure you want to delete "${windowToDelete?.title}"? This action cannot be undone.`}
            confirmLabel="Delete Maintenance Window"
            variant="danger"
            isLoading={deleteMutation.isPending}
          />
        </>
      )}
    </div>
  );
}
