import { describe, it, expect } from 'vitest';
import {
  servicesKeys,
  incidentsKeys,
  maintenanceKeys,
  analyticsKeys,
  organizationsKeys,
  escalationPolicyKeys,
  auditKeys,
  statusKeys,
} from '../queryKeys';

describe('Query Key Factories', () => {
  it('generates servicesKeys correctly', () => {
    expect(servicesKeys.all).toEqual(['services']);
    expect(servicesKeys.lists()).toEqual(['services', 'list']);
    expect(servicesKeys.list({ status: 'up' })).toEqual(['services', 'list', { filters: { status: 'up' } }]);
    expect(servicesKeys.detail('123')).toEqual(['services', 'detail', '123']);
  });

  it('generates incidentsKeys correctly', () => {
    expect(incidentsKeys.all).toEqual(['incidents']);
    expect(incidentsKeys.detail('456')).toEqual(['incidents', 'detail', '456']);
    expect(incidentsKeys.timeline('456')).toEqual(['incidents', 'detail', '456', 'timeline']);
  });

  it('generates roadmap namespaces correctly', () => {
    expect(maintenanceKeys.all).toEqual(['maintenance']);
    expect(analyticsKeys.summary()).toEqual(['analytics', 'summary']);
    expect(organizationsKeys.current()).toEqual(['organizations', 'current']);
    expect(escalationPolicyKeys.all).toEqual(['escalation-policies']);
    expect(auditKeys.all).toEqual(['audit-logs']);
    expect(statusKeys.all).toEqual(['status']);
    expect(statusKeys.overview('acme-corp')).toEqual(['status', 'acme-corp', 'overview']);
    expect(statusKeys.incidents('acme-corp')).toEqual(['status', 'acme-corp', 'incidents']);
    expect(statusKeys.maintenance('acme-corp')).toEqual(['status', 'acme-corp', 'maintenance']);
  });
});
