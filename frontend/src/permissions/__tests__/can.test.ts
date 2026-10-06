import { describe, it, expect } from 'vitest';
import { can } from '../can';
import { createTestUser } from '../../test/fixtures';

describe('can() Permission Helper — Phase 10 Settings & Team Permissions', () => {
  it('returns false for null user', () => {
    expect(can(null, 'service:read')).toBe(false);
  });

  it('allows owner all permissions including team management and audit log access', () => {
    const owner = createTestUser({ role: 'owner' });
    expect(can(owner, 'service:create')).toBe(true);
    expect(can(owner, 'organization:manage')).toBe(true);
    expect(can(owner, 'settings:manage')).toBe(true);
    expect(can(owner, 'member:invite')).toBe(true);
    expect(can(owner, 'member:changeRole')).toBe(true);
    expect(can(owner, 'member:remove')).toBe(true);
    expect(can(owner, 'audit:read')).toBe(true);
    expect(can(owner, 'statusPage:read')).toBe(true);
    expect(can(owner, 'statusPage:manage')).toBe(true);
    expect(can(owner, 'project:create')).toBe(true);
    expect(can(owner, 'issue:update')).toBe(true);
    expect(can(owner, 'issue:createIncident')).toBe(true);
    expect(can(owner, 'alert:manage')).toBe(true);
  });

  it('allows admin invite and audit log access, but restricts role change and removal', () => {
    const admin = createTestUser({ role: 'admin' });
    expect(can(admin, 'service:create')).toBe(true);
    expect(can(admin, 'incident:resolve')).toBe(true);
    expect(can(admin, 'member:invite')).toBe(true);
    expect(can(admin, 'audit:read')).toBe(true);
    expect(can(admin, 'statusPage:read')).toBe(true);
    expect(can(admin, 'statusPage:manage')).toBe(true);
    expect(can(admin, 'notification:read')).toBe(true);
    expect(can(admin, 'project:create')).toBe(true);
    expect(can(admin, 'issue:update')).toBe(true);
    expect(can(admin, 'issue:createIncident')).toBe(true);
    expect(can(admin, 'alert:manage')).toBe(true);
    expect(can(admin, 'member:changeRole')).toBe(false);
    expect(can(admin, 'member:remove')).toBe(false);
    expect(can(admin, 'organization:manage')).toBe(false);
  });

  it('restricts viewer from invite, role change, removal, and audit log reading', () => {
    const viewer = createTestUser({ role: 'viewer' });
    expect(can(viewer, 'service:read')).toBe(true);
    expect(can(viewer, 'incident:read')).toBe(true);
    expect(can(viewer, 'statusPage:read')).toBe(true);
    expect(can(viewer, 'notification:read')).toBe(true);
    expect(can(viewer, 'project:read')).toBe(true);
    expect(can(viewer, 'issue:read')).toBe(true);
    expect(can(viewer, 'statusPage:manage')).toBe(false);
    expect(can(viewer, 'project:create')).toBe(false);
    expect(can(viewer, 'issue:update')).toBe(false);
    expect(can(viewer, 'issue:createIncident')).toBe(false);
    expect(can(viewer, 'alert:manage')).toBe(false);
    expect(can(viewer, 'member:invite')).toBe(false);
    expect(can(viewer, 'member:changeRole')).toBe(false);
    expect(can(viewer, 'member:remove')).toBe(false);
    expect(can(viewer, 'audit:read')).toBe(false);
  });
});
