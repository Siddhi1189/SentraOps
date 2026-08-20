import { useState } from 'react';
import type { User } from '../../../../types/domain';
import { can } from '../../../../permissions/can';
import { Select } from '../../../../components/ui/Select/Select';
import { Spinner } from '../../../../components/ui/Spinner/Spinner';

export interface RoleChangeControlProps {
  member: User;
  currentUser: User | null;
  onRoleChange: (userId: string, newRole: 'admin' | 'viewer') => Promise<void>;
  isUpdating?: boolean;
}

export function RoleChangeControl({
  member,
  currentUser,
  onRoleChange,
  isUpdating = false,
}: RoleChangeControlProps) {
  const [loading, setLoading] = useState(false);
  const canChangeRole = can(currentUser, 'member:changeRole');
  const isSelf = currentUser?.id === member.id;
  const isOwnerRow = member.role === 'owner';

  const isDisabled = !canChangeRole || isSelf || isOwnerRow || isUpdating || loading;

  const getTooltip = () => {
    if (isSelf) return 'You cannot change your own role';
    if (isOwnerRow) return 'Organization owner role cannot be changed';
    if (!canChangeRole) return 'Only owners can change member roles';
    return undefined;
  };

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as 'admin' | 'viewer';
    if (newRole === member.role) return;

    setLoading(true);
    try {
      await onRoleChange(member.id, newRole);
    } finally {
      setLoading(false);
    }
  };

  if (isOwnerRow) {
    return (
      <span
        style={{
          textTransform: 'capitalize',
          fontWeight: 600,
          color: 'var(--color-primary, #2563eb)',
        }}
        title={getTooltip()}
      >
        owner
      </span>
    );
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }} title={getTooltip()}>
      <Select
        value={member.role}
        onChange={handleChange}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-label={`Change role for ${member.name}`}
        options={[
          { label: 'Admin', value: 'admin' },
          { label: 'Viewer', value: 'viewer' },
        ]}
        style={{ minWidth: '110px' }}
      />
      {(loading || isUpdating) && <Spinner size="sm" />}
    </div>
  );
}
