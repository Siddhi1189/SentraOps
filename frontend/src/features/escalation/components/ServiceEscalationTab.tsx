import { useState } from 'react';
import { useEscalationPoliciesQuery } from '../hooks/useEscalation';
import { EscalationPolicyFormDrawer } from './EscalationPolicyFormDrawer';
import { Spinner } from '../../../components/ui/Spinner/Spinner';
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState';
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState';
import { Button } from '../../../components/ui/Button/Button';
import { useSession } from '../../../app/providers/SessionProvider';
import { can } from '../../../permissions/can';
import styles from './ServiceEscalationTab.module.css';

export interface ServiceEscalationTabProps {
  serviceId: string;
}

export function ServiceEscalationTab({ serviceId }: ServiceEscalationTabProps) {
  const { user } = useSession();
  const canManage = can(user, 'escalation:manage');

  const { data: policiesRes, isLoading, isError, error, refetch } = useEscalationPoliciesQuery();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to Load Escalation Policy"
        message={error instanceof Error ? error.message : 'Network error'}
        onRetry={refetch}
      />
    );
  }

  const policies = policiesRes?.data || [];

  // Resolution Rule:
  // 1. Check for custom policy matching serviceId
  const customPolicy = policies.find((p) => p.serviceId === serviceId);

  // 2. Check for org-default policy (serviceId === null)
  const orgDefaultPolicy = policies.find((p) => p.serviceId === null);

  const activePolicy = customPolicy || orgDefaultPolicy;
  const isCustom = !!customPolicy;

  if (!activePolicy) {
    return (
      <EmptyState
        title="No Escalation Policy Resolved"
        description="No custom or organization default escalation policy is available for this service."
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Escalation Policy Settings</h2>
            <span
              className={`${styles.badge} ${isCustom ? styles.customBadge : styles.inheritedBadge}`}
              data-testid="service-escalation-badge"
            >
              {isCustom
                ? 'Custom Service Escalation Policy'
                : 'Inherits Organization Default Escalation Policy'}
            </span>
          </div>

          {canManage && (
            <Button
              type="button"
              variant={isCustom ? 'secondary' : 'primary'}
              onClick={() => setIsDrawerOpen(true)}
            >
              {isCustom ? 'Edit Custom Override' : '+ Create Custom Override'}
            </Button>
          )}
        </div>

        <div className={styles.thresholdGrid}>
          <div className={styles.thresholdBox}>
            <div className={styles.thresholdLabel}>Warning Threshold</div>
            <div className={styles.thresholdValue} data-testid="warning-threshold-value">
              {activePolicy.warningThreshold}
            </div>
            <div className={styles.thresholdSubtext}>Consecutive failed health checks</div>
          </div>

          <div className={styles.thresholdBox}>
            <div className={styles.thresholdLabel}>Incident Threshold</div>
            <div className={styles.thresholdValue} data-testid="incident-threshold-value">
              {activePolicy.incidentThreshold}
            </div>
            <div className={styles.thresholdSubtext}>Consecutive failed health checks</div>
          </div>

          <div className={styles.thresholdBox}>
            <div className={styles.thresholdLabel}>Critical Threshold</div>
            <div className={styles.thresholdValue} data-testid="critical-threshold-value">
              {activePolicy.criticalThreshold}
            </div>
            <div className={styles.thresholdSubtext}>Consecutive failed health checks</div>
          </div>
        </div>
      </div>

      {canManage && (
        <EscalationPolicyFormDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          policy={customPolicy || null}
          fixedServiceId={isCustom ? undefined : serviceId}
        />
      )}
    </div>
  );
}
