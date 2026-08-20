import { useState } from 'react';
import { useSession } from '../../../../app/providers/SessionProvider';
import { can } from '../../../../permissions/can';
import { PageHeader } from '../../../../components/ui/PageHeader/PageHeader';
import { Button } from '../../../../components/ui/Button/Button';
import { Spinner } from '../../../../components/ui/Spinner/Spinner';
import { ErrorState } from '../../../../components/ui/ErrorState/ErrorState';
import { MembersTable } from './MembersTable';
import { InviteMemberModal } from './InviteMemberModal';
import {
  useMembersQuery,
  useInviteMemberMutation,
  useUpdateMemberRoleMutation,
  useRemoveMemberMutation,
} from '../hooks/useOrganizations';
import styles from './TeamView.module.css';

export function TeamView() {
  const { user: currentUser } = useSession();
  const [page, setPage] = useState(1);
  const limit = 10;
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const filters = { page, limit };
  const { data: membersRes, isLoading, isError, error, refetch } = useMembersQuery(filters);

  const inviteMutation = useInviteMemberMutation();
  const updateRoleMutation = useUpdateMemberRoleMutation(filters);
  const removeMemberMutation = useRemoveMemberMutation(filters);

  const canInvite = can(currentUser, 'member:invite');
  const members = membersRes?.data || [];
  const total = membersRes?.pagination?.total ?? members.length;

  const handleInviteSubmit = async (data: { email: string; role: 'admin' | 'viewer' }) => {
    await inviteMutation.mutateAsync(data);
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'viewer') => {
    await updateRoleMutation.mutateAsync({ userId, role: newRole });
  };

  const handleRemoveMember = async (userId: string) => {
    await removeMemberMutation.mutateAsync(userId);
  };

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
        title="Failed to Load Team Members"
        message={error instanceof Error ? error.message : 'Members list could not be retrieved.'}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Team Members"
        description="Manage your organization's team members and role permissions."
        actions={
          canInvite ? (
            <Button type="button" onClick={() => setIsInviteOpen(true)}>
              + Invite Member
            </Button>
          ) : undefined
        }
      />

      <MembersTable
        members={members}
        currentUser={currentUser}
        page={page}
        limit={limit}
        total={total}
        onPageChange={setPage}
        onRoleChange={handleRoleChange}
        onRemoveMember={handleRemoveMember}
        updatingUserId={updateRoleMutation.isPending ? (updateRoleMutation.variables?.userId || null) : null}
        removingUserId={removeMemberMutation.isPending ? (removeMemberMutation.variables || null) : null}
      />

      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onInvite={handleInviteSubmit}
        isSubmitting={inviteMutation.isPending}
      />
    </div>
  );
}
