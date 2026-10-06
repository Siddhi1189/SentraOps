import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSession } from '../app/providers/SessionProvider';
import { can } from '../permissions/can';
import {
  useIssueQuery,
  useUpdateIssueMutation,
  useCreateIncidentFromIssueMutation,
} from '../features/issues/hooks/useIssues';
import { Spinner } from '../components/ui/Spinner/Spinner';
import { ErrorState } from '../components/ui/ErrorState/ErrorState';
import { Breadcrumbs } from '../components/ui/Breadcrumbs/Breadcrumbs';
import { IssueDetailHeader } from '../features/issues/components/IssueDetailHeader';
import { StackTracePanel } from '../features/issues/components/StackTracePanel';
import { BreadcrumbsPanel } from '../features/issues/components/BreadcrumbsPanel';
import { EventDetailsPanel } from '../features/issues/components/EventDetailsPanel';
import { CreateIncidentModal } from '../features/issues/components/CreateIncidentModal';
import type { ApiError } from '../types/api';

export function IssueDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { user } = useSession();

  const { data: issueResponse, isLoading, isError, error, refetch } = useIssueQuery(id);
  const updateMutation = useUpdateIssueMutation();
  const createIncidentMutation = useCreateIncidentFromIssueMutation();

  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  const issue = issueResponse?.data;
  const latestEvent = issue?.errorEvents?.[0];

  const canUpdate = can(user, 'issue:update');
  const canCreateIncident = can(user, 'issue:createIncident');

  const handleUpdateStatus = (newStatus: 'resolved' | 'unresolved' | 'ignored') => {
    if (!issue) return;
    setConflictError(null);
    updateMutation.mutate(
      {
        id: issue.id,
        data: {
          status: newStatus,
          currentUpdatedAt: issue.updatedAt,
        },
      },
      {
        onError: (err: ApiError) => {
          if (err.status === 409 || err.error?.code === 'CONCURRENCY_ERROR') {
            setConflictError('This issue was modified by another teammate. Please reload before saving changes.');
          }
        },
      }
    );
  };

  const handleCreateIncident = ({
    serviceId,
    title,
    severity,
  }: {
    serviceId: string;
    title: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }) => {
    if (!issue) return;
    createIncidentMutation.mutate(
      {
        id: issue.id,
        data: { serviceId, title, severity },
      },
      {
        onSuccess: () => {
          setIsIncidentModalOpen(false);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !issue) {
    return (
      <ErrorState
        title="Issue Not Found"
        message={error instanceof Error ? error.message : 'Could not find the requested issue.'}
        onRetry={refetch}
      />
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <Breadcrumbs
          items={[
            { label: 'Issues', href: '/app/issues' },
            { label: issue.title },
          ]}
        />
      </div>

      <IssueDetailHeader
        issue={issue}
        canUpdate={canUpdate}
        canCreateIncident={canCreateIncident}
        onResolve={() => handleUpdateStatus('resolved')}
        onIgnore={() => handleUpdateStatus('ignored')}
        onReopen={() => handleUpdateStatus('unresolved')}
        onCreateIncidentClick={() => setIsIncidentModalOpen(true)}
        isUpdating={updateMutation.isPending}
        conflictError={conflictError}
        onReload={refetch}
      />

      {/* Main Diagnostic Panels */}
      <StackTracePanel stack={latestEvent?.stack} />

      <EventDetailsPanel event={latestEvent} />

      <BreadcrumbsPanel breadcrumbs={latestEvent?.breadcrumbs} />

      {/* Create Incident Modal */}
      {isIncidentModalOpen && (
        <CreateIncidentModal
          isOpen={isIncidentModalOpen}
          onClose={() => setIsIncidentModalOpen(false)}
          issue={issue}
          onSubmit={handleCreateIncident}
          isLoading={createIncidentMutation.isPending}
        />
      )}
    </div>
  );
}

export default IssueDetailPage;
