import type { User } from '../../../../types/domain';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
} from '../../../../components/ui/Table/Table';
import { RoleChangeControl } from './RoleChangeControl';
import { RemoveMemberConfirm } from './RemoveMemberConfirm';

export interface MembersTableProps {
  members: User[];
  currentUser: User | null;
  page: number;
  limit: number;
  total: number;
  onPageChange: (newPage: number) => void;
  onRoleChange: (userId: string, newRole: 'admin' | 'viewer') => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  updatingUserId?: string | null;
  removingUserId?: string | null;
}

export function MembersTable({
  members,
  currentUser,
  page,
  limit,
  total,
  onPageChange,
  onRoleChange,
  onRemoveMember,
  updatingUserId,
  removingUserId,
}: MembersTableProps) {
  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div>
      <Table responsive>
        <TableHeader>
          <TableRow>
            <TableCell as="th">Name</TableCell>
            <TableCell as="th">Email</TableCell>
            <TableCell as="th">Role</TableCell>
            <TableCell as="th">Joined</TableCell>
            <TableCell as="th" style={{ textAlign: 'right' }}>
              Actions
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const isSelf = currentUser?.id === member.id;
            return (
              <TableRow key={member.id}>
                <TableCell dataLabel="Name">
                  <div style={{ fontWeight: 600 }}>
                    {member.name} {isSelf && <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(You)</span>}
                  </div>
                </TableCell>
                <TableCell dataLabel="Email">{member.email}</TableCell>
                <TableCell dataLabel="Role">
                  <RoleChangeControl
                    member={member}
                    currentUser={currentUser}
                    onRoleChange={onRoleChange}
                    isUpdating={updatingUserId === member.id}
                  />
                </TableCell>
                <TableCell dataLabel="Joined">{formatDate(member.createdAt)}</TableCell>
                <TableCell dataLabel="Actions" style={{ textAlign: 'right' }}>
                  <RemoveMemberConfirm
                    member={member}
                    currentUser={currentUser}
                    onRemove={onRemoveMember}
                    isRemoving={removingUserId === member.id}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {total > limit && (
        <TablePagination
          page={page}
          limit={limit}
          total={total}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
