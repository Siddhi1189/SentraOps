import { useState } from 'react';
import type { ServiceGroup } from '../../../types/domain';
import { useSession } from '../../../app/providers/SessionProvider';
import { can } from '../../../permissions/can';
import { Drawer } from '../../../components/ui/Drawer/Drawer';
import { Button } from '../../../components/ui/Button/Button';
import { GroupFormDrawer } from './GroupFormDrawer';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog/ConfirmDialog';
import {
  useGroupsQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
} from '../hooks/useServices';
import styles from './GroupsPanel.module.css';

export interface GroupsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GroupsPanel({ isOpen, onClose }: GroupsPanelProps) {
  const { user } = useSession();
  const canManage = can(user, 'group:manage');

  const { data: groupsData, isLoading } = useGroupsQuery();
  const groups = groupsData?.data || [];

  const createGroupMutation = useCreateGroupMutation();
  const updateGroupMutation = useUpdateGroupMutation();
  const deleteGroupMutation = useDeleteGroupMutation();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ServiceGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<ServiceGroup | null>(null);

  const handleOpenCreate = () => {
    setSelectedGroup(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (group: ServiceGroup) => {
    setSelectedGroup(group);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (formData: any) => {
    if (selectedGroup) {
      await updateGroupMutation.mutateAsync({ id: selectedGroup.id, data: formData });
    } else {
      await createGroupMutation.mutateAsync(formData);
    }
    setIsFormOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (deletingGroup) {
      await deleteGroupMutation.mutateAsync(deletingGroup.id);
      setDeletingGroup(null);
    }
  };

  // Build flat indented tree structure for parentGroupId
  const parentMap = new Map<string | null, ServiceGroup[]>();
  groups.forEach((g: ServiceGroup) => {
    const pId = g.parentGroupId || null;
    if (!parentMap.has(pId)) {
      parentMap.set(pId, []);
    }
    parentMap.get(pId)!.push(g);
  });

  const orderedGroups: { group: ServiceGroup; depth: number }[] = [];
  function traverse(pId: string | null, depth: number) {
    const children = parentMap.get(pId) || [];
    children.forEach((g: ServiceGroup) => {
      orderedGroups.push({ group: g, depth });
      traverse(g.id, depth + 1);
    });
  }
  traverse(null, 0);

  return (
    <>
      <Drawer isOpen={isOpen} onClose={onClose} title="Service Groups Management">
        <div className={styles.container}>
          <div className={styles.headerRow}>
            <h3 className={styles.title}>All Groups</h3>
            {canManage && (
              <Button type="button" variant="primary" onClick={handleOpenCreate}>
                + Add Group
              </Button>
            )}
          </div>

          {isLoading ? (
            <p>Loading groups...</p>
          ) : orderedGroups.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
              No service groups defined.
            </p>
          ) : (
            <div className={styles.groupList}>
              {orderedGroups.map(({ group, depth }) => (
                <div
                  key={group.id}
                  className={styles.groupItem}
                  style={{ marginLeft: `${depth * 20}px` }}
                >
                  <div className={styles.groupInfo}>
                    {depth > 0 && <span className={styles.indentMarker}>└─</span>}
                    <span className={styles.groupName}>{group.name}</span>
                  </div>

                  {canManage && (
                    <div className={styles.actions}>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handleOpenEdit(group)}
                        aria-label={`Edit group ${group.name}`}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => setDeletingGroup(group)}
                        aria-label={`Delete group ${group.name}`}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Drawer>

      {/* Group Form Drawer */}
      <GroupFormDrawer
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        groups={groups}
        initialGroup={selectedGroup}
        isSubmitting={createGroupMutation.isPending || updateGroupMutation.isPending}
      />

      {/* Group Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deletingGroup}
        onClose={() => setDeletingGroup(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Group"
        message={`Are you sure you want to delete "${deletingGroup?.name}"? Services assigned to this group will become unassigned.`}
        confirmLabel="Delete Group"
        isLoading={deleteGroupMutation.isPending}
      />
    </>
  );
}
