import { useState } from 'react';
import type { User } from '../../../../types/domain';
import { can } from '../../../../permissions/can';
import { Button } from '../../../../components/ui/Button/Button';
import { ConfirmDialog } from '../../../../components/feedback/ConfirmDialog/ConfirmDialog';

export interface RemoveMemberConfirmProps {
  member: User;
  currentUser: User | null;
  onRemove: (userId: string) => Promise<void>;
  isRemoving?: boolean;
}

export function RemoveMemberConfirm({
  member,
  currentUser,
  onRemove,
  isRemoving = false,
}: RemoveMemberConfirmProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const canRemove = can(currentUser, 'member:remove');
  const isSelf = currentUser?.id === member.id;
  const isOwnerRow = member.role === 'owner';

  const isDisabled = !canRemove || isSelf || isOwnerRow || isRemoving || loading;

  const getTooltip = () => {
    if (isSelf) return 'You cannot remove yourself';
    if (isOwnerRow) return 'Organization owner cannot be removed';
    if (!canRemove) return 'Only owners can remove team members';
    return undefined;
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onRemove(member.id);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  if (!canRemove && !isSelf && !isOwnerRow) {
    return null;
  }

  return (
    <>
      <span title={getTooltip()} style={{ display: 'inline-block' }}>
        <Button
          type="button"
          variant="danger"
          disabled={isDisabled}
          aria-disabled={isDisabled}
          onClick={() => setIsOpen(true)}
          aria-label={`Remove ${member.name}`}
        >
          Remove
        </Button>
      </span>

      <ConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirm}
        title="Remove Member"
        message={`Are you sure you want to remove "${member.name}" (${member.email}) from the organization?`}
        confirmLabel="Remove Member"
        isLoading={loading || isRemoving}
      />
    </>
  );
}
