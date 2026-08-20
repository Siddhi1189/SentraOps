import type { User, UserRole } from '../types/domain';

export type Permission =
  | 'service:create'
  | 'service:read'
  | 'service:update'
  | 'service:delete'
  | 'group:manage'
  | 'incident:create'
  | 'incident:read'
  | 'incident:update'
  | 'incident:resolve'
  | 'maintenance:create'
  | 'maintenance:read'
  | 'maintenance:update'
  | 'maintenance:delete'
  | 'maintenance:manage'
  | 'escalation:manage'
  | 'organization:manage'
  | 'settings:manage'
  | 'audit:read'
  | 'member:invite'
  | 'member:changeRole'
  | 'member:remove';

const ROLE_PERMISSIONS: Record<Lowercase<UserRole>, Permission[]> = {
  owner: [
    'service:create',
    'service:read',
    'service:update',
    'service:delete',
    'group:manage',
    'incident:create',
    'incident:read',
    'incident:update',
    'incident:resolve',
    'maintenance:create',
    'maintenance:read',
    'maintenance:update',
    'maintenance:delete',
    'maintenance:manage',
    'escalation:manage',
    'organization:manage',
    'settings:manage',
    'audit:read',
    'member:invite',
    'member:changeRole',
    'member:remove',
  ],
  admin: [
    'service:create',
    'service:read',
    'service:update',
    'service:delete',
    'group:manage',
    'incident:create',
    'incident:read',
    'incident:update',
    'incident:resolve',
    'maintenance:create',
    'maintenance:read',
    'maintenance:update',
    'maintenance:delete',
    'maintenance:manage',
    'escalation:manage',
    'audit:read',
    'member:invite',
  ],
  viewer: [
    'service:read',
    'incident:read',
    'maintenance:read',
  ],
};

export function can(
  user: User | null,
  permission: Permission,
  _context?: Record<string, unknown>
): boolean {
  if (!user || !user.role) {
    return false;
  }

  const normalizedRole = user.role.toLowerCase() as Lowercase<UserRole>;
  const allowedPermissions = ROLE_PERMISSIONS[normalizedRole];

  if (!allowedPermissions) {
    return false;
  }

  return allowedPermissions.includes(permission);
}
