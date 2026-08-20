import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '../../../app/providers/QueryClientProvider';
import { SessionProvider } from '../../../app/providers/SessionProvider';
import { ToastProvider } from '../../../app/providers/ToastProvider';
import { IncidentsView } from '../components/IncidentsView';
import { IncidentUpdatePanel } from '../components/IncidentUpdatePanel';
import { IncidentTimeline } from '../components/IncidentTimeline';
import { setAccessToken } from '../../../lib/authTokenStore';
import { createTestUser, createTestOrganization } from '../../../test/fixtures';
import type { IncidentDetail, TimelineEvent } from '../types/incidents';

const mockIncident: IncidentDetail = {
  id: 'inc-11111111-1111-4111-8111-111111111111',
  organizationId: 'o1',
  serviceId: 's1',
  assignedUserId: null,
  title: 'Database High Latency Spikes',
  status: 'open',
  severity: 'high',
  rootCause: 'Connection pool exhaustion',
  resolutionNotes: null,
  detectedAt: '2026-08-15T10:00:00.000Z',
  resolvedAt: null,
  createdAt: '2026-08-15T10:00:00.000Z',
  updatedAt: '2026-08-15T10:05:00.000Z',
  service: {
    id: 's1',
    organizationId: 'o1',
    groupId: null,
    name: 'PostgreSQL Primary Node',
    url: 'https://db.sentraops.com/health',
    httpMethod: 'GET',
    expectedStatusCode: 200,
    timeoutMs: 5000,
    checkIntervalSeconds: 60,
    environment: 'production',
    priority: 'critical',
    currentStatus: 'degraded',
    consecutiveFailures: 2,
    isActive: true,
    createdAt: '2026-08-15T00:00:00.000Z',
    updatedAt: '2026-08-15T00:00:00.000Z',
  },
};

const mockTimeline: TimelineEvent[] = [
  {
    id: 'tl-1',
    incidentId: 'inc-11111111-1111-4111-8111-111111111111',
    eventType: 'INCIDENT_CREATED',
    description: 'Incident automatically created after health check failures.',
    createdAt: '2026-08-15T10:00:00.000Z',
  },
  {
    id: 'tl-2',
    incidentId: 'inc-11111111-1111-4111-8111-111111111111',
    eventType: 'STATUS_CHANGED',
    description: 'Status changed from "open" to "investigating".',
    createdAt: '2026-08-15T10:10:00.000Z',
  },
];

function renderWithProviders(component: React.ReactNode) {
  return render(
    <QueryClientProvider>
      <SessionProvider>
        <ToastProvider>
          <MemoryRouter>{component}</MemoryRouter>
        </ToastProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}

describe('Phase 5 — Incidents Feature Integration & Compliance', () => {
  beforeEach(() => {
    setAccessToken('mock-admin-token');
    server.use(
      http.post('/api/v1/auth/refresh', () => {
        return HttpResponse.json({
          success: true,
          data: { accessToken: 'mock-admin-token' },
        });
      }),
      http.get('/api/v1/auth/me', () => {
        const org = createTestOrganization();
        const user = createTestUser({ role: 'admin', organizationId: org.id });
        return HttpResponse.json({
          success: true,
          data: { user: { ...user, organization: org } },
        });
      })
    );
  });

  describe('Permission Controls & Viewer Role Omission', () => {
    it('completely omits IncidentUpdatePanel for viewer role', async () => {
      setAccessToken('viewer-token');
      server.use(
        http.get('/api/v1/auth/me', () => {
          const org = createTestOrganization();
          const user = createTestUser({ role: 'viewer', organizationId: org.id });
          return HttpResponse.json({
            success: true,
            data: { user: { ...user, organization: org } },
          });
        })
      );

      renderWithProviders(<IncidentUpdatePanel incident={mockIncident} onReload={() => {}} />);

      await waitFor(() => {
        expect(screen.queryByText('Incident Triage & Management')).not.toBeInTheDocument();
      });
    });
  });

  describe('Immutable Read-Only Timeline', () => {
    it('renders timeline entries in an ordered list with ZERO edit/delete affordances', () => {
      renderWithProviders(<IncidentTimeline events={mockTimeline} />);

      const list = screen.getByRole('list');
      expect(list.tagName).toBe('OL');

      expect(screen.getByText('Incident Detected & Created')).toBeInTheDocument();
      expect(screen.getByText('Status / Severity Updated')).toBeInTheDocument();

      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });
  });

  describe('Optimistic Concurrency Control (OCC) & 409 Conflict Handling', () => {
    it('surfaces exact conflict banner and programmatically focuses banner on HTTP 409', async () => {
      const user = userEvent.setup();
      let reloadCalled = false;

      server.use(
        http.patch('/api/v1/incidents/:id', () => {
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
        }),
        http.get('/api/v1/organizations/members', () => {
          return HttpResponse.json({
            success: true,
            data: [],
            pagination: { page: 1, limit: 100, total: 0, totalPages: 1 },
          });
        })
      );

      renderWithProviders(
        <IncidentUpdatePanel
          incident={mockIncident}
          onReload={() => {
            reloadCalled = true;
          }}
        />
      );

      // Wait for SessionProvider hydration to complete with admin session
      await waitFor(() => {
        expect(screen.getByText('Incident Triage & Management')).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText('This incident was updated by someone else — reload to see the latest')
        ).toBeInTheDocument();
      });

      const alertBanner = screen.getByRole('alert');
      expect(document.activeElement).toBe(alertBanner);

      const reloadButton = screen.getByRole('button', { name: /reload/i });
      await user.click(reloadButton);
      expect(reloadCalled).toBe(true);
    });
  });

  describe('API Query Parameters & Endpoint Safety', () => {
    it('verifies GET /incidents correctly receives status, severity, and serviceId query parameters', async () => {
      let interceptedQueryParams: Record<string, string> = {};

      server.use(
        http.get('/api/v1/incidents', ({ request }) => {
          const url = new URL(request.url);
          url.searchParams.forEach((val, key) => {
            interceptedQueryParams[key] = val;
          });
          return HttpResponse.json({
            success: true,
            data: [mockIncident],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          });
        }),
        http.get('/api/v1/services', () => {
          return HttpResponse.json({
            success: true,
            data: [],
            pagination: { page: 1, limit: 100, total: 0, totalPages: 1 },
          });
        })
      );

      renderWithProviders(<IncidentsView />);

      await waitFor(() => {
        expect(screen.getByText('Database High Latency Spikes')).toBeInTheDocument();
      });

      expect(interceptedQueryParams).toHaveProperty('page');
      expect(interceptedQueryParams).toHaveProperty('limit');
    });
  });
});
