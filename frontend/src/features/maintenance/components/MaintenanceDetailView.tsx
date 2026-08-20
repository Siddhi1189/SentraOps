import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MaintenanceWindowDetail } from '../types/maintenance';
import { Spinner } from '../../../components/ui/Spinner/Spinner';
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState';
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState';
import { Button } from '../../../components/ui/Button/Button';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog/ConfirmDialog';
import { MaintenanceStatusChip } from './MaintenanceStatusChip';
import { MaintenanceFormDrawer } from './MaintenanceFormDrawer';
import { useSession } from '../../../app/providers/SessionProvider';
import { can } from '../../../permissions/can';
import {
  useMaintenanceDetailQuery,
  useDeleteMaintenanceMutation,
} from '../hooks/useMaintenance';
import styles from './MaintenanceDetailView.module.css';

export interface MaintenanceDetailViewProps {
  windowId: string;
}

export function MaintenanceDetailView({ windowId }: MaintenanceDetailViewProps) {
  const navigate = useNavigate();
  const { user } = useSession();
  const canManage = can(user, 'maintenance:manage');

  const { data: detailData, isLoading, isError, error, refetch } = useMaintenanceDetailQuery(windowId);
  const deleteMutation = useDeleteMaintenanceMutation();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const windowData = detailData?.data as MaintenanceWindowDetail | undefined;

  const handleDelete = async () => {
    if (!windowData) return;
    try {
      await deleteMutation.mutateAsync(windowData.id);
      navigate('/app/maintenance');
    } catch {
      // Handled in mutation onError toast
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    const is404 = (error as any)?.status === 404 || (error as any)?.error?.code === 'NOT_FOUND';

    if (is404) {
      return (
        <EmptyState
          title="Maintenance Window Not Found"
          description="The requested maintenance window could not be found."
          action={
            <Button type="button" variant="secondary" onClick={() => navigate('/maintenance')}>
              Back to Maintenance List
            </Button>
          }
        />
      );
    }

    return (
      <ErrorState
        title="Failed to Load Maintenance Window"
        message={error instanceof Error ? error.message : 'Network error occurred'}
        onRetry={refetch}
      />
    );
  }

  if (!windowData) {
    return (
      <EmptyState
        title="Maintenance Window Not Found"
        description="The requested maintenance window could not be found."
        action={
          <Button type="button" variant="secondary" onClick={() => navigate('/app/maintenance')}>
            Back to Maintenance List
          </Button>
        }
      />
    );
  }

  const scopeLabel =
    windowData.service?.name || (windowData.serviceId ? 'Service' : 'Organization-wide');

  return (
    <div className={styles.container}>
      <div className={styles.headerCard}>
        <div className={styles.topRow}>
          <div>
            <h1 className={styles.title}>{windowData.title}</h1>
            <div className={styles.badgeRow} style={{ marginTop: '8px' }}>
              <MaintenanceStatusChip status={windowData.status} />
            </div>
          </div>

          {canManage && (
            <div className={styles.actionsRow}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsEditOpen(true)}
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => setIsDeleteConfirmOpen(true)}
              >
                Delete
              </Button>
            </div>
          )}
        </div>

        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Service Scope</span>
            <span className={styles.metaValue}>{scopeLabel}</span>
          </div>

          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Start Time</span>
            <span className={styles.metaValue}>
              {new Date(windowData.startTime).toLocaleString()}
            </span>
          </div>

          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>End Time</span>
            <span className={styles.metaValue}>
              {new Date(windowData.endTime).toLocaleString()}
            </span>
          </div>

          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>API Status</span>
            <span className={styles.metaValue}>{windowData.status}</span>
          </div>
        </div>
      </div>

      {windowData.description && (
        <div className={styles.descriptionCard}>
          <h2 className={styles.sectionTitle}>Description</h2>
          <p className={styles.descriptionText}>{windowData.description}</p>
        </div>
      )}

      {canManage && (
        <>
          <MaintenanceFormDrawer
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            maintenanceWindow={windowData}
          />

          <ConfirmDialog
            isOpen={isDeleteConfirmOpen}
            onClose={() => setIsDeleteConfirmOpen(false)}
            onConfirm={handleDelete}
            title="Delete Maintenance Window"
            message={`Are you sure you want to delete "${windowData.title}"? This action cannot be undone.`}
            confirmLabel="Delete Maintenance Window"
            variant="danger"
            isLoading={deleteMutation.isPending}
          />
        </>
      )}
    </div>
  );
}
