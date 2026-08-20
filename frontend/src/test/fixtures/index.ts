import type { User, Organization, Service, Incident } from '../../types/domain';

export function createTestUser(overrides?: Partial<User>): User {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    organizationId: '00000000-0000-4000-8000-000000000000',
    name: 'Test User',
    email: 'test@sentraops.com',
    role: 'owner',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function createTestOrganization(overrides?: Partial<Organization>): Organization {
  return {
    id: '00000000-0000-4000-8000-000000000000',
    name: 'Acme Corp',
    slug: 'acme-corp',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function createTestService(overrides?: Partial<Service>): Service {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    organizationId: '00000000-0000-4000-8000-000000000000',
    groupId: null,
    name: 'API Gateway',
    url: 'https://api.acme.com/health',
    httpMethod: 'GET',
    expectedStatusCode: 200,
    timeoutMs: 5000,
    checkIntervalSeconds: 60,
    environment: 'production',
    priority: 'high',
    currentStatus: 'up',
    consecutiveFailures: 0,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function createTestIncident(overrides?: Partial<Incident>): Incident {
  return {
    id: '33333333-3333-4333-8333-333333333333',
    organizationId: '00000000-0000-4000-8000-000000000000',
    serviceId: '22222222-2222-4222-8222-222222222222',
    assignedUserId: null,
    title: 'High Latency Detected',
    status: 'open',
    severity: 'medium',
    rootCause: null,
    resolutionNotes: null,
    detectedAt: '2026-01-01T12:00:00.000Z',
    resolvedAt: null,
    createdAt: '2026-01-01T12:00:00.000Z',
    updatedAt: '2026-01-01T12:00:00.000Z',
    ...overrides,
  };
}
