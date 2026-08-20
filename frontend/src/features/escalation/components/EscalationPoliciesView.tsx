import { useState } from 'react';
import type { EscalationPolicy } from '../types/escalation';
import type { Service } from '../../../types/domain';
import { PageHeader } from '../../../components/ui/PageHeader/PageHeader';
import { Button } from '../../../components/ui/Button/Button';
import { Spinner } from '../../../components/ui/Spinner/Spinner';
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState';
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog/ConfirmDialog';
import { EscalationPolicyTable } from './EscalationPolicyTable';
import { EscalationPolicyFormDrawer } from './EscalationPolicyFormDrawer';
import { useServicesQuery } from '../../services/hooks/useServices';
import {
  useEscalationPoliciesQuery,
  useDeleteEscalationPolicyMutation,
} from '../hooks/useEscalation';
import { useSession } from '../../../app/providers/SessionProvider';
import { can } from '../../../permissions/can';

export function EscalationPoliciesView() {
  const { user } = useSession();
  const canManage = can(user, 'escalation:manage');

  const { data: policiesRes, isLoading, isError, error, refetch } = useEscalationPoliciesQuery();
  const { data: servicesRes } = useServicesQuery({ page: 1, limit: 100 });

  const deleteMutation = useDeleteEscalationPolicyMutation();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<EscalationPolicy | null>(null);
  const [policyToDelete, setPolicyToDelete] = useState<EscalationPolicy | null>(null);

  const policies = policiesRes?.data || [];
  const servicesList = servicesRes?.data || [];

  const servicesMap: Record<string, Service> = {};
  for (const s of servicesList) {
    servicesMap[s.id] = s;
  }

  const handleOpenCreate = () => {
    setSelectedPolicy(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (p: EscalationPolicy) => {
    setSelectedPolicy(p);
    setIsDrawerOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!policyToDelete) return;
    try {
      await deleteMutation.mutateAsync(policyToDelete.id);
      setPolicyToDelete(null);
    } catch {
      // Handled in mutation onError toast
    }
  };

  return (
    <div>
      <PageHeader
        title="Escalation Policies"
        description="Configure default and per-service incident escalation thresholds."
        actions={
          canManage ? (
            <Button type="button" variant="primary" onClick={handleOpenCreate}>
              + Add Escalation Policy
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Failed to Load Escalation Policies"
          message={error instanceof Error ? error.message : 'Network error occurred'}
          onRetry={refetch}
        />
      ) : policies.length === 0 ? (
        <EmptyState
          title="No custom escalation policies yet — all services use default monitoring behavior"
          description="Click below to configure custom escalation policies for your organization or specific services."
          action={
            canManage ? (
              <Button type="button" variant="primary" onClick={handleOpenCreate}>
                + Add Escalation Policy
              </Button>
            ) : undefined
          }
        />
      ) : (
        <EscalationPolicyTable
          policies={policies}
          servicesMap={servicesMap}
          onEdit={handleOpenEdit}
          onDelete={(p) => setPolicyToDelete(p)}
        />
      )}

      {canManage && (
        <>
          <EscalationPolicyFormDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            policy={selectedPolicy}
          />

          <ConfirmDialog
            isOpen={!!policyToDelete}
            onClose={() => setPolicyToDelete(null)}
            onConfirm={handleConfirmDelete}
            title="Delete Escalation Policy"
            message="Are you sure you want to delete this custom escalation policy? The service will revert to inheriting the organization default policy."
            confirmLabel="Delete Escalation Policy"
            variant="danger"
            isLoading={deleteMutation.isPending}
          />
        </>
      )}
    </div>
  );
}
