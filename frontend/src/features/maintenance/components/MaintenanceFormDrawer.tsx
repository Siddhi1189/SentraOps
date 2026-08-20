import { useState, useEffect } from 'react';
import type React from 'react';
import type { MaintenanceWindow } from '../../../types/domain';
import { Drawer } from '../../../components/ui/Drawer/Drawer';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { Select } from '../../../components/ui/Select/Select';
import { Spinner } from '../../../components/ui/Spinner/Spinner';
import { useServicesQuery } from '../../services/hooks/useServices';
import {
  useCreateMaintenanceMutation,
  useUpdateMaintenanceMutation,
} from '../hooks/useMaintenance';
import styles from './MaintenanceFormDrawer.module.css';

export interface MaintenanceFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  maintenanceWindow?: MaintenanceWindow | null;
}

function toDatetimeLocalValue(isoString?: string | null): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function MaintenanceFormDrawer({
  isOpen,
  onClose,
  maintenanceWindow,
}: MaintenanceFormDrawerProps) {
  const isEditing = !!maintenanceWindow;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [serviceId, setServiceId] = useState<string>('');

  // §J.9 Search-as-you-type + Pagination Discipline
  const [serviceSearch, setServiceSearch] = useState('');
  const [servicePage, setServicePage] = useState(1);

  const { data: servicesData, isLoading: isLoadingServices } = useServicesQuery({
    page: servicePage,
    limit: 20,
    search: serviceSearch || undefined,
  });

  const services = servicesData?.data || [];
  const totalServicePages = servicesData?.pagination?.totalPages || 1;

  const [validationError, setValidationError] = useState<string | null>(null);

  const createMutation = useCreateMaintenanceMutation();
  const updateMutation = useUpdateMaintenanceMutation();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (maintenanceWindow) {
      setTitle(maintenanceWindow.title || '');
      setDescription(maintenanceWindow.description || '');
      setStartTime(toDatetimeLocalValue(maintenanceWindow.startTime));
      setEndTime(toDatetimeLocalValue(maintenanceWindow.endTime));
      setServiceId(maintenanceWindow.serviceId || '');
    } else {
      setTitle('');
      setDescription('');
      setStartTime('');
      setEndTime('');
      setServiceId('');
    }
    setValidationError(null);
    setServiceSearch('');
    setServicePage(1);
  }, [maintenanceWindow, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!title.trim()) {
      setValidationError('Title is required');
      return;
    }
    if (!startTime) {
      setValidationError('Start time is required');
      return;
    }
    if (!endTime) {
      setValidationError('End time is required');
      return;
    }

    const startMs = new Date(startTime).getTime();
    const endMs = new Date(endTime).getTime();

    if (endMs <= startMs) {
      setValidationError('End time must be after start time');
      return;
    }

    const isoStart = new Date(startTime).toISOString();
    const isoEnd = new Date(endTime).toISOString();
    const finalServiceId = serviceId === '' ? null : serviceId;

    try {
      if (isEditing && maintenanceWindow) {
        await updateMutation.mutateAsync({
          id: maintenanceWindow.id,
          data: {
            title: title.trim(),
            description: description.trim() || undefined,
            startTime: isoStart,
            endTime: isoEnd,
            serviceId: finalServiceId,
          },
        });
      } else {
        await createMutation.mutateAsync({
          title: title.trim(),
          description: description.trim() || undefined,
          startTime: isoStart,
          endTime: isoEnd,
          serviceId: finalServiceId,
        });
      }
      onClose();
    } catch {
      // Handled in mutation onError toast
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Maintenance Window' : 'Schedule Maintenance Window'}
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {validationError && (
          <div className={styles.errorBanner} role="alert" aria-live="polite">
            {validationError}
          </div>
        )}

        <Input
          label="Title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Database Indexing Maintenance"
          required
        />

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the maintenance objectives..."
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="startTime">
            Start Time
          </label>
          <input
            id="startTime"
            type="datetime-local"
            className={styles.input}
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="endTime">
            End Time
          </label>
          <input
            id="endTime"
            type="datetime-local"
            className={styles.input}
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>

        <div className={styles.serviceSearchGroup}>
          <Input
            label="Filter Service Scope (search-as-you-type)"
            type="text"
            value={serviceSearch}
            onChange={(e) => {
              setServiceSearch(e.target.value);
              setServicePage(1);
            }}
            placeholder="Search services..."
          />

          <Select
            label="Target Service Scope"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            disabled={isLoadingServices}
            options={[
              { label: 'None (Organization-wide)', value: '' },
              ...services.map((s) => ({ label: s.name, value: s.id })),
            ]}
          />

          {totalServicePages > 1 && (
            <div className={styles.paginationRow}>
              <span>
                Page {servicePage} of {totalServicePages}
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={servicePage <= 1}
                  onClick={() => setServicePage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={servicePage >= totalServicePages}
                  onClick={() => setServicePage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.drawerFooter}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <Spinner size="sm" />
            ) : isEditing ? (
              'Save Changes'
            ) : (
              'Schedule Maintenance'
            )}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
