import { http, HttpResponse } from 'msw';
import { createTestUser, createTestOrganization } from '../fixtures';

let mockGroups = [
  {
    id: 'g-11111111-1111-4111-8111-111111111111',
    organizationId: 'o1',
    name: 'Core Services',
    parentGroupId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'g-22222222-2222-4222-8222-222222222222',
    organizationId: 'o1',
    name: 'Auth Subgroup',
    parentGroupId: 'g-11111111-1111-4111-8111-111111111111',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let mockServices = [
  {
    id: 's-11111111-1111-4111-8111-111111111111',
    organizationId: 'o1',
    groupId: 'g-11111111-1111-4111-8111-111111111111',
    name: 'Authentication API',
    url: 'https://auth.sentraops.com/health',
    httpMethod: 'GET',
    expectedStatusCode: 200,
    timeoutMs: 5000,
    checkIntervalSeconds: 60,
    environment: 'production',
    priority: 'critical',
    currentStatus: 'up',
    consecutiveFailures: 0,
    isActive: true,
    tags: ['auth', 'core'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 's-22222222-2222-4222-8222-222222222222',
    organizationId: 'o1',
    groupId: null,
    name: 'Payment Gateway Integration',
    url: 'https://payments.sentraops.com/ping',
    httpMethod: 'POST',
    expectedStatusCode: 200,
    timeoutMs: 10000,
    checkIntervalSeconds: 120,
    environment: 'production',
    priority: 'high',
    currentStatus: 'degraded',
    consecutiveFailures: 1,
    isActive: true,
    tags: ['payments'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let mockHealthChecks = [
  {
    id: 'hc-1',
    serviceId: 's-11111111-1111-4111-8111-111111111111',
    statusCode: 200,
    responseTimeMs: 145,
    isHealthy: true,
    errorMessage: null,
    checkedAt: new Date().toISOString(),
  },
  {
    id: 'hc-2',
    serviceId: 's-11111111-1111-4111-8111-111111111111',
    statusCode: 500,
    responseTimeMs: 2200,
    isHealthy: false,
    errorMessage: 'Internal Server Error',
    checkedAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

let mockIncidents = [
  {
    id: 'inc-11111111-1111-4111-8111-111111111111',
    organizationId: 'o1',
    serviceId: 's-11111111-1111-4111-8111-111111111111',
    assignedUserId: null,
    title: 'Authentication Latency Spike',
    status: 'open',
    severity: 'high',
    rootCause: null,
    resolutionNotes: null,
    detectedAt: new Date(Date.now() - 7200000).toISOString(),
    resolvedAt: null,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: '2026-08-15T10:00:00.000Z',
    service: mockServices[0],
    assignedUser: null,
  },
];

let mockTimelineEvents: Record<string, any[]> = {
  'inc-11111111-1111-4111-8111-111111111111': [
    {
      id: 'tl-1',
      incidentId: 'inc-11111111-1111-4111-8111-111111111111',
      eventType: 'INCIDENT_CREATED',
      description: 'Incident automatically created after health check failure.',
      metadata: { responseTimeMs: 2200 },
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ],
};

let mockOrganization = {
  id: 'o1',
  name: 'Acme Corp',
  slug: 'acme-corp',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

let mockMembers = [
  {
    id: 'u-admin-1',
    organizationId: 'o1',
    name: 'Alice Admin',
    email: 'alice@sentraops.com',
    role: 'admin',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'u-viewer-1',
    organizationId: 'o1',
    name: 'Bob Viewer',
    email: 'bob@sentraops.com',
    role: 'viewer',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let mockAuditLogs: any[] = [
  {
    id: 'al-1',
    organizationId: 'o1',
    userId: 'u-admin-1',
    action: 'member.invited',
    entityType: 'User',
    entityId: 'u-viewer-1',
    metadata: { email: 'bob@sentraops.com', role: 'viewer' },
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    user: { id: 'u-admin-1', name: 'Alice Admin', email: 'alice@sentraops.com' },
  },
  {
    id: 'al-2',
    organizationId: 'o1',
    userId: 'u-admin-1',
    action: 'service.created',
    entityType: 'Service',
    entityId: 's-11111111-1111-4111-8111-111111111111',
    metadata: { name: 'Authentication API', environment: 'production' },
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    user: { id: 'u-admin-1', name: 'Alice Admin', email: 'alice@sentraops.com' },
  },
];

let mockMaintenanceWindows: any[] = [
  {
    id: 'mw-11111111-1111-4111-8111-111111111111',
    organizationId: 'o1',
    serviceId: 's-11111111-1111-4111-8111-111111111111',
    title: 'Database Index Maintenance',
    description: 'Scheduled re-indexing of primary tables.',
    startTime: new Date(Date.now() + 3600000).toISOString(),
    endTime: new Date(Date.now() + 7200000).toISOString(),
    status: 'scheduled',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    service: mockServices[0],
  },
];

let mockEscalationPolicies: any[] = [
  {
    id: 'ep-org-default',
    organizationId: 'o1',
    serviceId: null,
    warningThreshold: 2,
    incidentThreshold: 3,
    criticalThreshold: 5,
    createdAt: new Date().toISOString(),
  },
];

export const handlers = [
  http.get('/api/v1/health', () => {
    return HttpResponse.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      },
    });
  }),

  http.post('/api/v1/auth/register', async ({ request }) => {
    const body = (await request.json()) as any;
    if (!body?.email || !body?.password || !body?.organizationName) {
      return HttpResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing fields' } },
        { status: 400 }
      );
    }
    const org = createTestOrganization({ name: body.organizationName });
    const user = createTestUser({ email: body.email, name: body.name, organizationId: org.id });
    return HttpResponse.json(
      {
        success: true,
        data: {
          user: { ...user, organization: org },
          organization: org,
          accessToken: 'mock-register-token',
        },
      },
      { status: 201 }
    );
  }),

  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = (await request.json()) as any;
    if (body?.email === 'invalid@sentraops.com' || body?.password === 'wrongpassword') {
      return HttpResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
        { status: 401 }
      );
    }
    const role = body?.email === 'viewer@sentraops.com' ? 'viewer' : 'admin';
    const org = createTestOrganization();
    const user = createTestUser({ email: body?.email || 'test@sentraops.com', role: role as any, organizationId: org.id });
    return HttpResponse.json({
      success: true,
      data: {
        user: { ...user, organization: org },
        organization: org,
        accessToken: 'mock-login-token',
      },
    });
  }),

  http.post('/api/v1/auth/refresh', () => {
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: 'mock-refreshed-token',
      },
    });
  }),

  http.get('/api/v1/auth/me', () => {
    const org = createTestOrganization();
    const user = createTestUser({ organizationId: org.id });
    return HttpResponse.json({
      success: true,
      data: {
        user: { ...user, organization: org },
      },
    });
  }),

  http.post('/api/v1/auth/logout', () => {
    return HttpResponse.json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    });
  }),

  http.post('/api/v1/auth/forgot-password', async ({ request }) => {
    const body = (await request.json()) as any;
    if (!body?.email) {
      return HttpResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Email is required' } },
        { status: 400 }
      );
    }
    return HttpResponse.json({
      success: true,
      data: {
        message: 'Password reset email sent if account exists',
      },
    });
  }),

  http.post('/api/v1/auth/reset-password', async ({ request }) => {
    const body = (await request.json()) as any;
    if (body?.token === 'invalid-token') {
      return HttpResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Reset token is invalid or expired' } },
        { status: 400 }
      );
    }
    return HttpResponse.json({
      success: true,
      data: {
        message: 'Password has been reset successfully',
      },
    });
  }),

  http.post('/api/v1/organizations/invite/accept', async ({ request }) => {
    const body = (await request.json()) as any;
    if (body?.token === 'invalid-token') {
      return HttpResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Invite token is invalid or expired' } },
        { status: 400 }
      );
    }
    const org = createTestOrganization();
    const user = createTestUser({ name: body?.name || 'Invited User', organizationId: org.id });
    return HttpResponse.json(
      {
        success: true,
        data: {
          user: { ...user, organization: org },
          organization: org,
          accessToken: 'mock-invite-token',
        },
      },
      { status: 201 }
    );
  }),

  // Service Groups Endpoints
  http.get('/api/v1/services/groups', ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search');
    let results = [...mockGroups];
    if (search) {
      results = results.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));
    }
    return HttpResponse.json({
      success: true,
      data: results,
      pagination: { page: 1, limit: 100, total: results.length, totalPages: 1 },
    });
  }),

  http.post('/api/v1/services/groups', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.includes('viewer')) {
      return HttpResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Viewer role cannot manage groups' } },
        { status: 403 }
      );
    }
    const body = (await request.json()) as any;
    const newGroup = {
      id: `g-${Date.now()}`,
      organizationId: 'o1',
      name: body.name,
      parentGroupId: body.parentGroupId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockGroups.push(newGroup);
    return HttpResponse.json({ success: true, data: newGroup }, { status: 201 });
  }),

  http.patch('/api/v1/services/groups/:id', async ({ request, params }) => {
    const body = (await request.json()) as any;
    const group = mockGroups.find((g) => g.id === params.id);
    if (group) {
      if (body.name) group.name = body.name;
      if (body.parentGroupId !== undefined) group.parentGroupId = body.parentGroupId;
    }
    return HttpResponse.json({ success: true, data: group });
  }),

  http.delete('/api/v1/services/groups/:id', ({ params }) => {
    mockGroups = mockGroups.filter((g) => g.id !== params.id);
    return HttpResponse.json({ success: true, data: { message: 'Group deleted successfully' } });
  }),

  // Services Endpoints
  http.get('/api/v1/services', ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search');
    const groupId = url.searchParams.get('groupId');
    const page = Number(url.searchParams.get('page') || '1');
    const limit = Number(url.searchParams.get('limit') || '10');

    let filtered = [...mockServices];
    if (groupId) {
      filtered = filtered.filter((s) => s.groupId === groupId);
    }
    if (search) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.url.toLowerCase().includes(search.toLowerCase())
      );
    }

    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return HttpResponse.json({
      success: true,
      data: paginated,
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit),
      },
    });
  }),

  http.get('/api/v1/services/:id', ({ params }) => {
    const service = mockServices.find((s) => s.id === params.id);
    if (!service) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Service not found' } },
        { status: 404 }
      );
    }
    return HttpResponse.json({ success: true, data: service });
  }),

  http.post('/api/v1/services', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.includes('viewer')) {
      return HttpResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Viewer role cannot create service' } },
        { status: 403 }
      );
    }
    const body = (await request.json()) as any;
    const newService = {
      id: `s-${Date.now()}`,
      organizationId: 'o1',
      groupId: body.groupId || null,
      name: body.name,
      url: body.url,
      httpMethod: body.httpMethod || 'GET',
      expectedStatusCode: body.expectedStatusCode || 200,
      timeoutMs: body.timeoutMs || 5000,
      checkIntervalSeconds: body.checkIntervalSeconds || 60,
      environment: body.environment || 'production',
      priority: body.priority || 'medium',
      currentStatus: 'up' as const,
      consecutiveFailures: 0,
      isActive: body.isActive ?? true,
      tags: body.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockServices.push(newService);
    return HttpResponse.json({ success: true, data: newService }, { status: 201 });
  }),

  http.patch('/api/v1/services/:id', async ({ request, params }) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.includes('viewer')) {
      return HttpResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Viewer role cannot update service' } },
        { status: 403 }
      );
    }
    const body = (await request.json()) as any;
    const service = mockServices.find((s) => s.id === params.id);
    if (service) {
      Object.assign(service, body);
    }
    return HttpResponse.json({ success: true, data: service });
  }),

  http.delete('/api/v1/services/:id', ({ request, params }) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.includes('viewer')) {
      return HttpResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Viewer role cannot delete service' } },
        { status: 403 }
      );
    }
    mockServices = mockServices.filter((s) => s.id !== params.id);
    return HttpResponse.json({ success: true, data: { message: 'Service deleted successfully' } });
  }),

  // Health Checks Endpoint
  http.get('/api/v1/health-checks/service/:serviceId', ({ params }) => {
    const checks = mockHealthChecks.filter((hc) => hc.serviceId === params.serviceId);
    return HttpResponse.json({
      success: true,
      data: checks,
      pagination: { page: 1, limit: 10, total: checks.length, totalPages: 1 },
    });
  }),

  // Incidents Endpoints
  http.get('/api/v1/incidents', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const severity = url.searchParams.get('severity');
    const serviceId = url.searchParams.get('serviceId');
    const page = Number(url.searchParams.get('page') || '1');
    const limit = Number(url.searchParams.get('limit') || '10');

    let filtered = [...mockIncidents];
    if (status) filtered = filtered.filter((i) => i.status === status);
    if (severity) filtered = filtered.filter((i) => i.severity === severity);
    if (serviceId) filtered = filtered.filter((i) => i.serviceId === serviceId);

    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return HttpResponse.json({
      success: true,
      data: paginated,
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit),
      },
    });
  }),

  http.get('/api/v1/incidents/:id', ({ params }) => {
    const incident = mockIncidents.find((i) => i.id === params.id);
    if (!incident) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Incident not found' } },
        { status: 404 }
      );
    }
    return HttpResponse.json({ success: true, data: incident });
  }),

  http.patch('/api/v1/incidents/:id', async ({ request, params }) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.includes('viewer')) {
      return HttpResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Viewer role cannot update incident' } },
        { status: 403 }
      );
    }

    const body = (await request.json()) as any;
    const incident = mockIncidents.find((i) => i.id === params.id);
    if (!incident) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Incident not found' } },
        { status: 404 }
      );
    }

    if (body.updatedAt && new Date(body.updatedAt).getTime() !== new Date(incident.updatedAt).getTime()) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'CONCURRENCY_ERROR',
            message: 'Incident was modified by someone else. Please reload.',
          },
        },
        { status: 409 }
      );
    }

    const newUpdatedAt = new Date().toISOString();
    if (body.status) incident.status = body.status;
    if (body.severity) incident.severity = body.severity;
    if (body.assignedUserId !== undefined) incident.assignedUserId = body.assignedUserId;
    if (body.rootCause !== undefined) incident.rootCause = body.rootCause;
    if (body.resolutionNotes !== undefined) incident.resolutionNotes = body.resolutionNotes;
    incident.updatedAt = newUpdatedAt;

    if (!mockTimelineEvents[incident.id]) mockTimelineEvents[incident.id] = [];
    mockTimelineEvents[incident.id].push({
      id: `tl-${Date.now()}`,
      incidentId: incident.id,
      eventType: 'STATUS_CHANGED',
      description: `Incident updated: status set to "${incident.status}".`,
      createdAt: newUpdatedAt,
    });

    return HttpResponse.json({ success: true, data: incident });
  }),

  http.get('/api/v1/incidents/:id/timeline', ({ params }) => {
    const events = mockTimelineEvents[params.id as string] || [];
    return HttpResponse.json({ success: true, data: events });
  }),

  // Organization & Team Endpoints
  http.get('/api/v1/organizations', () => {
    return HttpResponse.json({
      success: true,
      data: {
        organization: mockOrganization,
      },
    });
  }),

  http.post('/api/v1/organizations/invite', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.includes('viewer')) {
      return HttpResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Viewer role cannot invite team members' } },
        { status: 403 }
      );
    }
    const body = (await request.json()) as any;
    return HttpResponse.json(
      {
        success: true,
        data: { email: body.email, role: body.role, status: 'invited' },
      },
      { status: 201 }
    );
  }),

  http.get('/api/v1/organizations/members', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || '1');
    const limit = Number(url.searchParams.get('limit') || '10');

    const start = (page - 1) * limit;
    const paginated = mockMembers.slice(start, start + limit);

    return HttpResponse.json({
      success: true,
      data: { members: paginated },
      pagination: { page, limit, total: mockMembers.length, totalPages: Math.max(1, Math.ceil(mockMembers.length / limit)) },
    });
  }),

  http.patch('/api/v1/organizations/members/:userId/role', async ({ request, params }) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.includes('viewer') || authHeader?.includes('admin')) {
      return HttpResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only owners can change member roles' } },
        { status: 403 }
      );
    }

    const body = (await request.json()) as any;
    const member = mockMembers.find((m) => m.id === params.userId);
    if (member) {
      member.role = body.role;
    }
    return HttpResponse.json({ success: true, data: { user: member } });
  }),

  http.delete('/api/v1/organizations/members/:userId', ({ request, params }) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.includes('viewer') || authHeader?.includes('admin')) {
      return HttpResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only owners can remove team members' } },
        { status: 403 }
      );
    }

    mockMembers = mockMembers.filter((m) => m.id !== params.userId);
    return HttpResponse.json({ success: true, data: { message: 'Member removed successfully' } });
  }),

  // Audit Logs Endpoint
  http.get('/api/v1/audit-logs', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.includes('viewer')) {
      return HttpResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Viewer role cannot access audit logs' } },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const entityType = url.searchParams.get('entityType');
    const userId = url.searchParams.get('userId');
    const page = Number(url.searchParams.get('page') || '1');
    const limit = Number(url.searchParams.get('limit') || '10');

    let filtered = [...mockAuditLogs];
    if (entityType) filtered = filtered.filter((log) => log.entityType === entityType);
    if (userId) filtered = filtered.filter((log) => log.userId === userId);

    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return HttpResponse.json({
      success: true,
      data: { auditLogs: paginated },
      pagination: { page, limit, total: filtered.length, totalPages: Math.max(1, Math.ceil(filtered.length / limit)) },
    });
  }),

  // Public Status Page Endpoints
  http.get('/api/v1/status/:orgSlug', ({ params }) => {
    if (params.orgSlug === 'invalid-slug-404') {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Status page not found' } },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: {
        settings: {
          id: 'sp-1',
          organizationId: 'o1',
          companyName: 'Acme Corp',
          subdomain: params.orgSlug as string,
          logoUrl: null,
          theme: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          organization: { id: 'o1', name: 'Acme Corp', slug: params.orgSlug as string },
        },
        services: [
          { id: 's-1', name: 'Authentication API', currentStatus: 'up', environment: 'production', group: { id: 'g-1', name: 'Core APIs' } },
          { id: 's-2', name: 'Database Cluster', currentStatus: 'up', environment: 'production', group: { id: 'g-1', name: 'Core APIs' } },
        ],
        openIncidents: [],
        maintenance: [],
      },
    });
  }),

  http.get('/api/v1/status/:orgSlug/incidents', ({ params }) => {
    if (params.orgSlug === 'invalid-slug-404') {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Status page not found' } },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: {
        incidents: [
          {
            id: 'inc-pub-1',
            title: 'Minor Database Degraded Performance',
            status: 'resolved',
            severity: 'low',
            detectedAt: new Date(Date.now() - 86400000).toISOString(),
            resolvedAt: new Date(Date.now() - 82000000).toISOString(),
            service: { id: 's-2', name: 'Database Cluster' },
          },
        ],
      },
    });
  }),

  http.get('/api/v1/status/:orgSlug/maintenance', ({ params }) => {
    if (params.orgSlug === 'invalid-slug-404') {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Status page not found' } },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: {
        maintenance: [
          {
            id: 'mw-pub-1',
            title: 'DB Engine Upgrade',
            description: 'Upgrading database engine to v15',
            startTime: new Date(Date.now() + 86400000).toISOString(),
            endTime: new Date(Date.now() + 90000000).toISOString(),
            status: 'scheduled',
            service: { id: 's-2', name: 'Database Cluster' },
          },
        ],
      },
    });
  }),

  // Maintenance Endpoints
  http.get('/api/v1/maintenance', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || '1');
    const limit = Number(url.searchParams.get('limit') || '10');

    const start = (page - 1) * limit;
    const paginated = mockMaintenanceWindows.slice(start, start + limit);

    return HttpResponse.json({
      success: true,
      data: paginated,
      pagination: {
        page,
        limit,
        total: mockMaintenanceWindows.length,
        totalPages: Math.ceil(mockMaintenanceWindows.length / limit),
      },
    });
  }),

  http.get('/api/v1/maintenance/:id', ({ params }) => {
    const win = mockMaintenanceWindows.find((w) => w.id === params.id);
    if (!win) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Maintenance window not found' } },
        { status: 404 }
      );
    }
    return HttpResponse.json({ success: true, data: win });
  }),

  http.post('/api/v1/maintenance', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.includes('viewer')) {
      return HttpResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Viewer role cannot create maintenance window' } },
        { status: 403 }
      );
    }
    const body = (await request.json()) as any;
    const service = body.serviceId ? mockServices.find((s) => s.id === body.serviceId) || null : null;

    const newWin = {
      id: `mw-${Date.now()}`,
      organizationId: 'o1',
      serviceId: body.serviceId || null,
      title: body.title,
      description: body.description || null,
      startTime: body.startTime,
      endTime: body.endTime,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      service,
    };
    mockMaintenanceWindows.push(newWin);
    return HttpResponse.json({ success: true, data: newWin }, { status: 201 });
  }),

  http.patch('/api/v1/maintenance/:id', async ({ request, params }) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.includes('viewer')) {
      return HttpResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Viewer role cannot update maintenance window' } },
        { status: 403 }
      );
    }
    const body = (await request.json()) as any;
    const win = mockMaintenanceWindows.find((w) => w.id === params.id);
    if (!win) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Maintenance window not found' } },
        { status: 404 }
      );
    }

    if (body.title) win.title = body.title;
    if (body.description !== undefined) win.description = body.description;
    if (body.startTime) win.startTime = body.startTime;
    if (body.endTime) win.endTime = body.endTime;
    if (body.serviceId !== undefined) {
      win.serviceId = body.serviceId;
      win.service = body.serviceId ? mockServices.find((s) => s.id === body.serviceId) || null : null;
    }
    win.updatedAt = new Date().toISOString();

    return HttpResponse.json({ success: true, data: win });
  }),

  http.delete('/api/v1/maintenance/:id', ({ request, params }) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.includes('viewer')) {
      return HttpResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Viewer role cannot delete maintenance window' } },
        { status: 403 }
      );
    }
    mockMaintenanceWindows = mockMaintenanceWindows.filter((w) => w.id !== params.id);
    return HttpResponse.json({ success: true, data: { message: 'Maintenance window deleted successfully' } });
  }),

  // Analytics Endpoints
  http.get('/api/v1/analytics/services/:id', ({ params }) => {
    const serviceId = params.id as string;
    if (serviceId === 'zero-history-service-id' || serviceId === 'empty-service') {
      return HttpResponse.json({
        success: true,
        data: {
          serviceId,
          rolling7Days: { uptimePercent: 100, avgLatency: 0, failureCount: 0, totalCount: 0 },
          rolling30Days: { uptimePercent: 100, avgLatency: 0, failureCount: 0, totalCount: 0 },
          rolling90Days: { uptimePercent: 100, avgLatency: 0, failureCount: 0, totalCount: 0 },
        },
      });
    }

    if (serviceId === 'partial-history-service-id') {
      return HttpResponse.json({
        success: true,
        data: {
          serviceId,
          rolling7Days: { uptimePercent: 100, avgLatency: 0, failureCount: 0, totalCount: 0 },
          rolling30Days: { uptimePercent: 99.5, avgLatency: 120, failureCount: 1, totalCount: 200 },
          rolling90Days: { uptimePercent: 99.8, avgLatency: 115, failureCount: 1, totalCount: 500 },
        },
      });
    }

    return HttpResponse.json({
      success: true,
      data: {
        serviceId,
        rolling7Days: { uptimePercent: 99.85, avgLatency: 142.3, failureCount: 2, totalCount: 1340 },
        rolling30Days: { uptimePercent: 99.91, avgLatency: 138.5, failureCount: 5, totalCount: 5760 },
        rolling90Days: { uptimePercent: 99.95, avgLatency: 135.2, failureCount: 8, totalCount: 17280 },
      },
    });
  }),

  http.get('/api/v1/analytics/incidents', ({ request }) => {
    const url = new URL(request.url);
    const serviceId = url.searchParams.get('serviceId');

    if (serviceId) {
      return HttpResponse.json({
        success: true,
        data: {
          totalIncidents: 3,
          resolvedIncidents: 2,
          mttrSeconds: 900,
          mttrHuman: '15m 0s',
          severityDistribution: {
            low: 1,
            medium: 1,
            high: 1,
            critical: 0,
          },
          statusDistribution: {
            open: 0,
            investigating: 1,
            identified: 0,
            monitoring: 0,
            resolved: 2,
          },
        },
      });
    }

    return HttpResponse.json({
      success: true,
      data: {
        totalIncidents: 12,
        resolvedIncidents: 9,
        mttrSeconds: 2340.5,
        mttrHuman: '39m 0s',
        severityDistribution: {
          low: 2,
          medium: 5,
          high: 4,
          critical: 1,
        },
        statusDistribution: {
          open: 1,
          investigating: 1,
          identified: 1,
          monitoring: 0,
          resolved: 9,
        },
      },
    });
  }),

  // Escalation Policies Endpoints
  http.get('/api/v1/escalation-policies', () => {
    return HttpResponse.json({
      success: true,
      data: mockEscalationPolicies,
    });
  }),

  http.get('/api/v1/escalation-policies/:id', ({ params }) => {
    const policy = mockEscalationPolicies.find((p) => p.id === params.id);
    if (!policy) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Escalation policy not found' } },
        { status: 404 }
      );
    }
    return HttpResponse.json({ success: true, data: policy });
  }),

  http.post('/api/v1/escalation-policies', async ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.includes('viewer')) {
      return HttpResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Viewer role cannot configure escalation policies' } },
        { status: 403 }
      );
    }

    const body = (await request.json()) as any;
    const warningThreshold = Number(body.warningThreshold);
    const incidentThreshold = Number(body.incidentThreshold);
    const criticalThreshold = Number(body.criticalThreshold);

    if (warningThreshold >= incidentThreshold) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_THRESHOLDS',
            message: 'warning_threshold must be less than incident_threshold',
          },
        },
        { status: 400 }
      );
    }

    if (incidentThreshold >= criticalThreshold) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_THRESHOLDS',
            message: 'incident_threshold must be less than critical_threshold',
          },
        },
        { status: 400 }
      );
    }

    const serviceId = body.serviceId || null;
    let existingIndex = mockEscalationPolicies.findIndex((p) => p.serviceId === serviceId);

    if (existingIndex >= 0) {
      mockEscalationPolicies[existingIndex] = {
        ...mockEscalationPolicies[existingIndex],
        warningThreshold,
        incidentThreshold,
        criticalThreshold,
      };
      return HttpResponse.json({ success: true, data: mockEscalationPolicies[existingIndex] });
    } else {
      const newPolicy = {
        id: `ep-${Date.now()}`,
        organizationId: 'o1',
        serviceId,
        warningThreshold,
        incidentThreshold,
        criticalThreshold,
        createdAt: new Date().toISOString(),
      };
      mockEscalationPolicies.push(newPolicy);
      return HttpResponse.json({ success: true, data: newPolicy }, { status: 201 });
    }
  }),

  http.delete('/api/v1/escalation-policies/:id', ({ request, params }) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.includes('viewer')) {
      return HttpResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Viewer role cannot delete escalation policies' } },
        { status: 403 }
      );
    }

    const policy = mockEscalationPolicies.find((p) => p.id === params.id);
    if (!policy) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Escalation policy not found' } },
        { status: 404 }
      );
    }

    if (policy.serviceId === null) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'CANNOT_DELETE_DEFAULT',
            message: 'Cannot delete the organization-wide default escalation policy',
          },
        },
        { status: 400 }
      );
    }

    mockEscalationPolicies = mockEscalationPolicies.filter((p) => p.id !== params.id);
    return HttpResponse.json({ success: true, data: { message: 'Escalation policy deleted successfully' } });
  }),
];
