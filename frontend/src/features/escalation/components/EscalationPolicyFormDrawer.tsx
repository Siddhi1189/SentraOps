import { useState, useEffect } from 'react';
import type React from 'react';
import type { EscalationPolicy } from '../types/escalation';
import { Drawer } from '../../../components/ui/Drawer/Drawer';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { Select } from '../../../components/ui/Select/Select';
import { Spinner } from '../../../components/ui/Spinner/Spinner';
import { useServicesQuery } from '../../services/hooks/useServices';
import { useUpsertEscalationPolicyMutation } from '../hooks/useEscalation';
import styles from './EscalationPolicyFormDrawer.module.css';

export interface EscalationPolicyFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  policy?: EscalationPolicy | null | undefined;
  fixedServiceId?: string | null | undefined;
}

export function EscalationPolicyFormDrawer({
  isOpen,
  onClose,
  policy,
  fixedServiceId,
}: EscalationPolicyFormDrawerProps) {
  const isEditing = !!policy;

  const [serviceId, setServiceId] = useState<string>('');
  const [warningThreshold, setWarningThreshold] = useState<string>('1');
  const [incidentThreshold, setIncidentThreshold] = useState<string>('2');
  const [criticalThreshold, setCriticalThreshold] = useState<string>('3');

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
  const upsertMutation = useUpsertEscalationPolicyMutation();

  useEffect(() => {
    if (!isOpen) return;

    if (policy) {
      setServiceId(policy.serviceId || '');
      setWarningThreshold(String(policy.warningThreshold));
      setIncidentThreshold(String(policy.incidentThreshold));
      setCriticalThreshold(String(policy.criticalThreshold));
    } else if (fixedServiceId !== undefined) {
      setServiceId(fixedServiceId || '');
      setWarningThreshold('1');
      setIncidentThreshold('2');
      setCriticalThreshold('3');
    } else {
      setServiceId('');
      setWarningThreshold('1');
      setIncidentThreshold('2');
      setCriticalThreshold('3');
    }
    setValidationError(null);
    setServiceSearch('');
    setServicePage(1);
  }, [policy, fixedServiceId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const warn = Number(warningThreshold);
    const inc = Number(incidentThreshold);
    const crit = Number(criticalThreshold);

    if (isNaN(warn) || warn < 1) {
      setValidationError('Warning threshold must be at least 1 failure');
      return;
    }
    if (isNaN(inc) || inc < 2) {
      setValidationError('Incident threshold must be at least 2 failures');
      return;
    }
    if (isNaN(crit) || crit < 3) {
      setValidationError('Critical threshold must be at least 3 failures');
      return;
    }

    if (warn >= inc) {
      setValidationError('Warning threshold must be strictly less than incident threshold');
      return;
    }
    if (inc >= crit) {
      setValidationError('Incident threshold must be strictly less than critical threshold');
      return;
    }

    const finalServiceId =
      fixedServiceId !== undefined
        ? fixedServiceId || null
        : serviceId === ''
        ? null
        : serviceId;

    try {
      await upsertMutation.mutateAsync({
        serviceId: finalServiceId,
        warningThreshold: warn,
        incidentThreshold: inc,
        criticalThreshold: crit,
      });
      onClose();
    } catch (err: any) {
      setValidationError(err?.error?.message || 'Failed to save escalation policy');
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Escalation Policy' : 'Create Escalation Policy'}
    >
      <form onSubmit={handleSubmit} noValidate className={styles.form}>
        {validationError && (
          <div className={styles.errorBanner} role="alert" aria-live="polite">
            {validationError}
          </div>
        )}

        {fixedServiceId === undefined && (
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
              label="Target Scope"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              disabled={isLoadingServices || isEditing}
              options={[
                { label: 'None (Organization-wide Default)', value: '' },
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
        )}

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="warningThreshold">
            Warning Threshold (Consecutive Failures)
          </label>
          <input
            id="warningThreshold"
            type="number"
            min={1}
            className={styles.input}
            value={warningThreshold}
            onChange={(e) => setWarningThreshold(e.target.value)}
            required
          />
          <span className={styles.helperText}>
            Triggers a warning state after this number of consecutive failed health checks (min 1).
          </span>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="incidentThreshold">
            Incident Threshold (Consecutive Failures)
          </label>
          <input
            id="incidentThreshold"
            type="number"
            min={2}
            className={styles.input}
            value={incidentThreshold}
            onChange={(e) => setIncidentThreshold(e.target.value)}
            required
          />
          <span className={styles.helperText}>
            Automatically opens an incident after this number of failed health checks (min 2, must be &gt; warning threshold).
          </span>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="criticalThreshold">
            Critical Threshold (Consecutive Failures)
          </label>
          <input
            id="criticalThreshold"
            type="number"
            min={3}
            className={styles.input}
            value={criticalThreshold}
            onChange={(e) => setCriticalThreshold(e.target.value)}
            required
          />
          <span className={styles.helperText}>
            Escalates incident severity to critical after this number of failed health checks (min 3, must be &gt; incident threshold).
          </span>
        </div>

        <div className={styles.drawerFooter}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={upsertMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={upsertMutation.isPending}>
            {upsertMutation.isPending ? <Spinner size="sm" /> : 'Save Escalation Policy'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
