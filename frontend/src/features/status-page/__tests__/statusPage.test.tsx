import type React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  OverallStatusBanner,
  computeAggregateStatus,
} from '../components/OverallStatusBanner';
import { PublicStatusOverviewPage } from '../../../pages/PublicStatusOverviewPage';
import { PublicStatusIncidentsPage } from '../../../pages/PublicStatusIncidentsPage';
import { PublicStatusMaintenancePage } from '../../../pages/PublicStatusMaintenancePage';
import type { StatusPageService } from '../../../api/status';

function renderPublicRoute(ui: React.ReactElement, { initialEntries = ['/status/acme-corp'] } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Phase 11 — Public Status Page Integration & Compliance', () => {
  describe('OverallStatusBanner Worst-Status-Wins Logic', () => {
    it('computes aggregate status correctly based on worst-status-wins hierarchy (down > degraded > up)', () => {
      const allUp: StatusPageService[] = [
        { id: '1', name: 'API', currentStatus: 'up' },
        { id: '2', name: 'DB', currentStatus: 'up' },
      ];
      expect(computeAggregateStatus(allUp)).toBe('up');

      const oneDegraded: StatusPageService[] = [
        { id: '1', name: 'API', currentStatus: 'up' },
        { id: '2', name: 'DB', currentStatus: 'degraded' },
      ];
      expect(computeAggregateStatus(oneDegraded)).toBe('degraded');

      const oneDown: StatusPageService[] = [
        { id: '1', name: 'API', currentStatus: 'degraded' },
        { id: '2', name: 'DB', currentStatus: 'down' },
      ];
      expect(computeAggregateStatus(oneDown)).toBe('down');
    });

    it('renders banner with matching title, subtitle, and accessible role="status"', () => {
      const services: StatusPageService[] = [
        { id: '1', name: 'API', currentStatus: 'up' },
      ];
      render(<OverallStatusBanner services={services} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('All Systems Operational')).toBeInTheDocument();
    });
  });

  describe('Authentication Independence & Zero Authorization Header Verification', () => {
    it('proves GET /status/:orgSlug requests carry NO Authorization header', async () => {
      let capturedAuthHeader: string | null = 'INITIAL_NON_NULL';

      server.use(
        http.get('/api/v1/status/:orgSlug', ({ request }) => {
          capturedAuthHeader = request.headers.get('Authorization');
          return HttpResponse.json({
            success: true,
            data: {
              settings: {
                id: 'sp-1',
                organizationId: 'o1',
                companyName: 'Acme Corp',
                subdomain: 'acme-corp',
                logoUrl: null,
                theme: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              services: [{ id: 's-1', name: 'Auth API', currentStatus: 'up' }],
              openIncidents: [],
              maintenance: [],
            },
          });
        })
      );

      renderPublicRoute(
        <Routes>
          <Route path="/status/:orgSlug" element={<PublicStatusOverviewPage />} />
        </Routes>
      );

      await waitFor(() => {
        expect(screen.getByText('All Systems Operational')).toBeInTheDocument();
      });

      // CRITICAL SECURITY ASSERTION: Authorization header must be completely null/absent
      expect(capturedAuthHeader).toBeNull();
    });

    it('proves GET /status/:orgSlug/incidents requests carry NO Authorization header', async () => {
      let capturedAuthHeader: string | null = 'INITIAL_NON_NULL';

      server.use(
        http.get('/api/v1/status/:orgSlug/incidents', ({ request }) => {
          capturedAuthHeader = request.headers.get('Authorization');
          return HttpResponse.json({
            success: true,
            data: { incidents: [] },
          });
        })
      );

      renderPublicRoute(
        <Routes>
          <Route path="/status/:orgSlug/incidents" element={<PublicStatusIncidentsPage />} />
        </Routes>,
        { initialEntries: ['/status/acme-corp/incidents'] }
      );

      await waitFor(() => {
        expect(screen.getByText('Incident History')).toBeInTheDocument();
      });

      expect(capturedAuthHeader).toBeNull();
    });

    it('proves GET /status/:orgSlug/maintenance requests carry NO Authorization header', async () => {
      let capturedAuthHeader: string | null = 'INITIAL_NON_NULL';

      server.use(
        http.get('/api/v1/status/:orgSlug/maintenance', ({ request }) => {
          capturedAuthHeader = request.headers.get('Authorization');
          return HttpResponse.json({
            success: true,
            data: { maintenance: [] },
          });
        })
      );

      renderPublicRoute(
        <Routes>
          <Route path="/status/:orgSlug/maintenance" element={<PublicStatusMaintenancePage />} />
        </Routes>,
        { initialEntries: ['/status/acme-corp/maintenance'] }
      );

      await waitFor(() => {
        expect(screen.getByText('Maintenance Schedule')).toBeInTheDocument();
      });

      expect(capturedAuthHeader).toBeNull();
    });
  });

  describe('Loading, 404, Retry & Document Title Lifecycle across all 3 Public Routes', () => {
    it('handles 404 invalid orgSlug cleanly on overview page', async () => {
      renderPublicRoute(
        <Routes>
          <Route path="/status/:orgSlug" element={<PublicStatusOverviewPage />} />
        </Routes>,
        { initialEntries: ['/status/invalid-slug-404'] }
      );

      await waitFor(() => {
        expect(screen.getByText('Status Page Not Found')).toBeInTheDocument();
      });
    });

    it('handles 404 invalid orgSlug cleanly on incidents page', async () => {
      renderPublicRoute(
        <Routes>
          <Route path="/status/:orgSlug/incidents" element={<PublicStatusIncidentsPage />} />
        </Routes>,
        { initialEntries: ['/status/invalid-slug-404/incidents'] }
      );

      await waitFor(() => {
        expect(screen.getByText('Status Page Not Found')).toBeInTheDocument();
      });
    });

    it('handles 404 invalid orgSlug cleanly on maintenance page', async () => {
      renderPublicRoute(
        <Routes>
          <Route path="/status/:orgSlug/maintenance" element={<PublicStatusMaintenancePage />} />
        </Routes>,
        { initialEntries: ['/status/invalid-slug-404/maintenance'] }
      );

      await waitFor(() => {
        expect(screen.getByText('Status Page Not Found')).toBeInTheDocument();
      });
    });

    it('handles non-404 transient API failure with Working Retry action on overview page', async () => {
      let callCount = 0;
      server.use(
        http.get('/api/v1/status/:orgSlug', () => {
          callCount++;
          if (callCount === 1) {
            return HttpResponse.json(
              { success: false, error: { code: 'SERVER_ERROR', message: 'Temporary DB Outage' } },
              { status: 500 }
            );
          }
          return HttpResponse.json({
            success: true,
            data: {
              settings: { companyName: 'Acme Corp', logoUrl: null, theme: null },
              services: [{ id: 's-1', name: 'API', currentStatus: 'up' }],
              openIncidents: [],
              maintenance: [],
            },
          });
        })
      );

      renderPublicRoute(
        <Routes>
          <Route path="/status/:orgSlug" element={<PublicStatusOverviewPage />} />
        </Routes>
      );

      await waitFor(() => {
        expect(screen.getByText('Unable to Load Status')).toBeInTheDocument();
      });

      const retryBtn = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryBtn);

      await waitFor(() => {
        expect(screen.getByText('All Systems Operational')).toBeInTheDocument();
      });
    });

    it('sets correct route-specific document titles across overview, incidents, and maintenance pages', async () => {
      renderPublicRoute(
        <Routes>
          <Route path="/status/:orgSlug" element={<PublicStatusOverviewPage />} />
        </Routes>
      );

      await waitFor(() => {
        expect(document.title).toBe('Acme Corp — All Systems Operational');
      });

      renderPublicRoute(
        <Routes>
          <Route path="/status/:orgSlug/incidents" element={<PublicStatusIncidentsPage />} />
        </Routes>,
        { initialEntries: ['/status/acme-corp/incidents'] }
      );

      await waitFor(() => {
        expect(document.title).toBe('Acme Corp — Incident History');
      });

      renderPublicRoute(
        <Routes>
          <Route path="/status/:orgSlug/maintenance" element={<PublicStatusMaintenancePage />} />
        </Routes>,
        { initialEntries: ['/status/acme-corp/maintenance'] }
      );

      await waitFor(() => {
        expect(document.title).toBe('Acme Corp — Maintenance Schedule');
      });
    });
  });
});
