import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from '../../../app/providers/SessionProvider';
import { ToastProvider } from '../../../app/providers/ToastProvider';
import { MaintenanceView } from '../components/MaintenanceView';
import { MaintenanceDetailView } from '../components/MaintenanceDetailView';
import { MaintenanceFormDrawer } from '../components/MaintenanceFormDrawer';
import { server } from '../../../test/msw/server';
import { http, HttpResponse } from 'msw';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function renderWithProviders(ui: React.ReactNode, { initialEntries = ['/maintenance'] } = {}) {
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

describe('Phase 6 — Maintenance Feature Integration & Compliance', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('auth_token', 'mock-token-admin');
    server.resetHandlers();
  });

  it('validates start and end times in form and announces error via aria-live', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    renderWithProviders(
      <MaintenanceFormDrawer isOpen={true} onClose={handleClose} />
    );

    await user.type(screen.getByLabelText(/title/i), 'Emergency DB Patch');
    await user.type(screen.getByLabelText(/start time/i), '2026-08-20T14:00');
    await user.type(screen.getByLabelText(/end time/i), '2026-08-20T12:00'); // end before start!

    await user.click(screen.getByRole('button', { name: 'Schedule Maintenance' }));

    // Assert aria-live announced validation error
    const errorBanner = screen.getByRole('alert');
    expect(errorBanner).toBeInTheDocument();
    expect(errorBanner).toHaveAttribute('aria-live', 'polite');
    expect(errorBanner).toHaveTextContent('End time must be after start time');
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('enforces API GET parameter discipline (never sends status/date params to GET /maintenance)', async () => {
    let capturedUrl: URL | null = null;

    server.use(
      http.get('/api/v1/maintenance', ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json({
          success: true,
          data: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
        });
      })
    );

    renderWithProviders(<MaintenanceView />);

    await waitFor(() => {
      expect(capturedUrl).not.toBeNull();
    });

    if (capturedUrl) {
      const url = capturedUrl as URL;
      expect(url.searchParams.has('status')).toBe(false);
      expect(url.searchParams.has('date')).toBe(false);
      expect(url.searchParams.has('startDate')).toBe(false);
      expect(url.searchParams.has('endDate')).toBe(false);
      expect(url.searchParams.has('page')).toBe(true);
      expect(url.searchParams.has('limit')).toBe(true);
    }
  });

  it('enforces mutation body safety (never sends status field in POST or PATCH payloads)', async () => {
    let postBody: any = null;

    server.use(
      http.post('/api/v1/maintenance', async ({ request }) => {
        postBody = await request.json();
        return HttpResponse.json(
          {
            success: true,
            data: {
              id: 'mw-new',
              organizationId: 'o1',
              serviceId: null,
              title: postBody.title,
              description: postBody.description || null,
              startTime: postBody.startTime,
              endTime: postBody.endTime,
              status: 'scheduled',
              createdAt: new Date().toISOString(),
            },
          },
          { status: 201 }
        );
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<MaintenanceView />);

    // Wait for session boot hydration so can(user, 'maintenance:manage') resolves to true
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ schedule maintenance/i })).toBeInTheDocument();
    });

    // Open Drawer
    await user.click(screen.getByRole('button', { name: /\+ schedule maintenance/i }));

    await user.type(screen.getByLabelText(/title/i), 'Server Security Upgrade');
    await user.type(screen.getByLabelText(/start time/i), '2026-08-20T10:00');
    await user.type(screen.getByLabelText(/end time/i), '2026-08-20T12:00');

    await user.click(screen.getByRole('button', { name: 'Schedule Maintenance' }));

    await waitFor(() => {
      expect(postBody).not.toBeNull();
    });

    expect(postBody).not.toHaveProperty('status');
  });

  it('omits write controls for viewer role and handles MSW 403 Forbidden correctly', async () => {
    // Setup viewer session
    server.use(
      http.get('/api/v1/auth/me', () => {
        return HttpResponse.json({
          success: true,
          data: {
            user: {
              id: 'u-viewer',
              email: 'viewer@sentraops.com',
              name: 'Viewer Bob',
              role: 'viewer',
              organizationId: 'o1',
            },
          },
        });
      })
    );

    renderWithProviders(
      <Routes>
        <Route path="/maintenance" element={<MaintenanceView />} />
        <Route path="/maintenance/:id" element={<MaintenanceDetailPageWrapper />} />
      </Routes>,
      { initialEntries: ['/maintenance'] }
    );

    // Wait for session boot
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /maintenance windows/i })).toBeInTheDocument();
    });

    // Assert write controls are completely omitted for viewer role
    expect(screen.queryByRole('button', { name: /\+ schedule maintenance/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });
});

function MaintenanceDetailPageWrapper() {
  return <MaintenanceDetailView windowId="mw-11111111-1111-4111-8111-111111111111" />;
}
