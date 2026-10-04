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
  | 'statusPage:read'
  | 'statusPage:manage'
  | 'notification:read'
  | 'audit:read'
  | 'member:invite'
  | 'member:changeRole'
  | 'member:remove'
  | 'project:create'
  | 'project:read'
  | 'project:update'
  | 'project:delete'
  | 'issue:read'
  | 'issue:update'
  | 'issue:createIncident'
  | 'alert:read'
  | 'alert:manage';

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
    'statusPage:read',
    'statusPage:manage',
    'notification:read',
    'audit:read',
    'member:invite',
    'member:changeRole',
    'member:remove',
    'project:create',
    'project:read',
    'project:update',
    'project:delete',
    'issue:read',
    'issue:update',
    'issue:createIncident',
    'alert:read',
    'alert:manage',
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
    'statusPage:read',
    'statusPage:manage',
    'notification:read',
    'audit:read',
    'member:invite',
    'project:create',
    'project:read',
    'project:update',
    'project:delete',
    'issue:read',
    'issue:update',
    'issue:createIncident',
    'alert:read',
    'alert:manage',
  ],
  viewer: [
    'service:read',
    'incident:read',
    'maintenance:read',
    'statusPage:read',
    'notification:read',
    'project:read',
    'issue:read',
    'alert:read',
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
