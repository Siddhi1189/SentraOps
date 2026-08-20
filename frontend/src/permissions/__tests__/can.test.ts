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
  });

  it('allows admin invite and audit log access, but restricts role change and removal', () => {
    const admin = createTestUser({ role: 'admin' });
    expect(can(admin, 'service:create')).toBe(true);
    expect(can(admin, 'incident:resolve')).toBe(true);
    expect(can(admin, 'member:invite')).toBe(true);
    expect(can(admin, 'audit:read')).toBe(true);
    expect(can(admin, 'member:changeRole')).toBe(false);
    expect(can(admin, 'member:remove')).toBe(false);
    expect(can(admin, 'organization:manage')).toBe(false);
  });

  it('restricts viewer from invite, role change, removal, and audit log reading', () => {
    const viewer = createTestUser({ role: 'viewer' });
    expect(can(viewer, 'service:read')).toBe(true);
    expect(can(viewer, 'incident:read')).toBe(true);
    expect(can(viewer, 'member:invite')).toBe(false);
    expect(can(viewer, 'member:changeRole')).toBe(false);
    expect(can(viewer, 'member:remove')).toBe(false);
    expect(can(viewer, 'audit:read')).toBe(false);
  });
});
