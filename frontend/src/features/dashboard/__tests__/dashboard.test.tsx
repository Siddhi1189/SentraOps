import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from '../../../app/providers/SessionProvider';
import { ToastProvider } from '../../../app/providers/ToastProvider';
import { OverviewView } from '../components/OverviewView';
import { ServiceStatusRollupSection } from '../components/ServiceStatusRollupSection';
import { IncidentSnapshotPanel } from '../components/IncidentSnapshotPanel';
import { ServicesPage } from '../../../pages/ServicesPage';
import { server } from '../../../test/msw/server';
import { http, HttpResponse } from 'msw';
import { DASHBOARD_SERVICE_ROLLUP_LIMIT } from '../constants';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function renderWithProviders(ui: React.ReactNode, { initialEntries = ['/'] } = {}) {
  const queryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
        </ToastProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}

describe('Phase 7 — Dashboard Overview Compliance & Behavior', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('auth_token', 'mock-token-admin');
    server.resetHandlers();
  });

  describe('ServiceStatusRollup Completeness & Bound Labeling', () => {
    it('labels complete result when fetched count equals pagination.total', async () => {
      server.use(
        http.get('/api/v1/services', () => {
          return HttpResponse.json({
            success: true,
            data: [
              { id: 's1', currentStatus: 'up', name: 'S1' },
              { id: 's2', currentStatus: 'down', name: 'S2' },
            ],
            pagination: { page: 1, limit: DASHBOARD_SERVICE_ROLLUP_LIMIT, total: 2, totalPages: 1 },
          });
        })
      );

      renderWithProviders(<ServiceStatusRollupSection />);

      await waitFor(() => {
        expect(screen.getByTestId('service-rollup-completeness')).toHaveTextContent(
          'All services — 2 shown'
        );
      });
    });

    it('labels bounded result when fetched count is less than pagination.total', async () => {
      server.use(
        http.get('/api/v1/services', () => {
          return HttpResponse.json({
            success: true,
            data: Array.from({ length: 50 }, (_, i) => ({
              id: `s${i}`,
              currentStatus: 'up',
              name: `S${i}`,
            })),
            pagination: { page: 1, limit: 50, total: 120, totalPages: 3 },
          });
        })
      );

      renderWithProviders(<ServiceStatusRollupSection />);

      await waitFor(() => {
        expect(screen.getByTestId('service-rollup-completeness')).toHaveTextContent(
          '50 of 120 services shown'
        );
      });
    });

    it('honestly states bound limit when pagination.total is missing', async () => {
      server.use(
        http.get('/api/v1/services', () => {
          return HttpResponse.json({
            success: true,
            data: [{ id: 's1', currentStatus: 'up', name: 'S1' }],
          });
        })
      );

      renderWithProviders(<ServiceStatusRollupSection />);

      await waitFor(() => {
        expect(screen.getByTestId('service-rollup-completeness')).toHaveTextContent(
          `Showing up to ${DASHBOARD_SERVICE_ROLLUP_LIMIT} services`
        );
      });
    });
  });

  describe('IncidentSnapshotPanel Visualization Safety', () => {
    it('renders confirmed distribution values and accessible summary without line/area/time-axis charts', async () => {
      renderWithProviders(<IncidentSnapshotPanel />);

      await waitFor(() => {
        expect(screen.getByText('Total Incidents')).toBeInTheDocument();
      });

      // Assert total incidents, resolved, MTTR metrics
      expect(screen.getByText('12')).toBeInTheDocument(); // total
      expect(screen.getAllByText('9')).toHaveLength(2); // resolved stat box & resolved status distribution
      expect(screen.getByText('39m 0s')).toBeInTheDocument(); // mttrHuman

      // Assert screen reader summary text present
      expect(
        screen.getByText(/Incident Analytics Snapshot: 12 total incidents, 9 resolved. MTTR is 39m 0s./i)
      ).toBeInTheDocument();

      // Assert NO SVG line/area/canvas elements or time axes exist in DOM
      expect(document.querySelector('svg line')).toBeNull();
      expect(document.querySelector('svg path')).toBeNull();
      expect(document.querySelector('canvas')).toBeNull();
    });
  });

  describe('Frontend-Only Status Query Parameter Contract', () => {
    it('navigates from dashboard status chip to /services?status=down, applies client filter, and sends ZERO status= query param to GET /services', async () => {
      let interceptedServicesUrl: URL | null = null;

      server.use(
        http.get('/api/v1/services', ({ request }) => {
          interceptedServicesUrl = new URL(request.url);
          return HttpResponse.json({
            success: true,
            data: [
              { id: 's1', name: 'Auth API', currentStatus: 'up' },
              { id: 's2', name: 'Payment API', currentStatus: 'down' },
            ],
            pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
          });
        })
      );

      const user = userEvent.setup();

      function LocationDisplay() {
        const location = useLocation();
        return <div data-testid="location-display">{location.pathname + location.search}</div>;
      }

      renderWithProviders(
        <>
          <LocationDisplay />
          <Routes>
            <Route path="/" element={<OverviewView />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/app/services" element={<ServicesPage />} />
          </Routes>
        </>,
        { initialEntries: ['/'] }
      );

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByTestId('status-rollup-chip-down')).toBeInTheDocument();
      });

      // Click the DOWN status chip on dashboard
      await user.click(screen.getByTestId('status-rollup-chip-down'));

      // Verify navigation reached /services?status=down
      await waitFor(() => {
        expect(screen.getByTestId('location-display')).toHaveTextContent(/services\?status=down/);
      });

      // Verify Services page renders and applies client-side filter (Payment API is down, Auth API is up)
      await waitFor(() => {
        expect(screen.getByText('Payment API')).toBeInTheDocument();
        expect(screen.queryByText('Auth API')).not.toBeInTheDocument();
      });

      // VERIFICATION GATE: Assert intercepted GET /api/v1/services network call contains NO status= query parameter
      expect(interceptedServicesUrl).not.toBeNull();
      const url = interceptedServicesUrl as unknown as URL;
      expect(url.searchParams.has('status')).toBe(false);
    });
  });
});
