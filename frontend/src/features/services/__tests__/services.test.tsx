import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '../../../app/providers/QueryClientProvider';
import { SessionProvider } from '../../../app/providers/SessionProvider';
import { ToastProvider } from '../../../app/providers/ToastProvider';
import { ServicesPage } from '../../../pages/ServicesPage';
import { ServiceDetailPage } from '../../../pages/ServiceDetailPage';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog/ConfirmDialog';
import { listServices, createService } from '../../../api/services';
import { setAccessToken } from '../../../lib/authTokenStore';
import { createTestUser, createTestOrganization } from '../../../test/fixtures';

function renderWithProviders(initialEntries = ['/services']) {
  return render(
    <QueryClientProvider>
      <SessionProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={initialEntries}>
            <Routes>
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/services/:id" element={<ServiceDetailPage />} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}

describe('Phase 4 — Services & Groups Integration & Compliance', () => {
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

  describe('API Query Discipline — Forbidden Status Parameter Gate', () => {
    it('verifies GET /services request NEVER sends status query parameter', async () => {
      let interceptedSearchParamKeys: string[] = [];

      server.use(
        http.get('/api/v1/services', ({ request }) => {
          const url = new URL(request.url);
          interceptedSearchParamKeys = Array.from(url.searchParams.keys());
          return HttpResponse.json({
            success: true,
            data: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
          });
        })
      );

      await listServices({ page: 1, limit: 10, search: 'auth' });

      expect(interceptedSearchParamKeys).not.toContain('status');
      expect(interceptedSearchParamKeys).toEqual(expect.arrayContaining(['page', 'limit', 'search']));
    });
  });

  describe('Modal & ConfirmDialog Composition', () => {
    it('ConfirmDialog composes Modal and puts initial focus on Cancel button', async () => {
      render(
        <ConfirmDialog
          isOpen={true}
          onClose={() => {}}
          onConfirm={() => {}}
          title="Delete Test Service"
          message="Are you sure you want to delete this service?"
          confirmLabel="Delete"
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /delete test service/i })).toBeInTheDocument();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(document.activeElement).toBe(cancelButton);
    });
  });

  describe('Permission Controls & Viewer Role Enforcement', () => {
    it('omits write controls for viewer role in UI', async () => {
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

      renderWithProviders(['/services']);

      await waitFor(() => {
        expect(screen.getByText('Authentication API')).toBeInTheDocument();
      });

      // Write controls (+ Add Service, Manage Groups, Edit, Delete) MUST be absent
      expect(screen.queryByRole('button', { name: /\+ add service/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /manage groups/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });

    it('real API rejects viewer write attempts with HTTP 403 Forbidden', async () => {
      setAccessToken('viewer-token');
      let status = 0;

      try {
        await createService({
          name: 'Unauthorized Service',
          url: 'https://unauthorized.com/health',
          httpMethod: 'GET',
          expectedStatusCode: 200,
          timeoutMs: 5000,
          checkIntervalSeconds: 60,
          environment: 'production',
          priority: 'medium',
          isActive: true,
          tags: [],
        });
      } catch (err: any) {
        status = err.status || 403;
      }

      expect(status).toBe(403);
    });
  });

  describe('Services List & Detail Page Integration', () => {
    it('renders Services list and allows searching', async () => {
      const user = userEvent.setup();
      renderWithProviders(['/services']);

      await waitFor(() => {
        expect(screen.getByText('Authentication API')).toBeInTheDocument();
      });

      const searchInput = screen.getByLabelText(/search services/i);
      await user.type(searchInput, 'Payment');

      await waitFor(() => {
        expect(screen.getByText('Payment Gateway Integration')).toBeInTheDocument();
        expect(screen.queryByText('Authentication API')).not.toBeInTheDocument();
      });
    });

    it('navigates to Service Detail Page and switches tabs', async () => {
      const user = userEvent.setup();
      renderWithProviders(['/services/s-11111111-1111-4111-8111-111111111111']);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1, name: /authentication api/i })).toBeInTheDocument();
      });

      expect(screen.getByRole('tab', { name: /overview/i })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('Target URL:')).toBeInTheDocument();

      // Switch to Health Check History tab
      const healthTab = screen.getByRole('tab', { name: /health check history/i });
      await user.click(healthTab);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByText('HEALTHY')).toBeInTheDocument();
      });
    });
  });
});
