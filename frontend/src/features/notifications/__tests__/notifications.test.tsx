import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from '../../../app/providers/SessionProvider';
import { ToastProvider } from '../../../app/providers/ToastProvider';
import { NotificationsMenu } from '../../../components/layout/NotificationsMenu/NotificationsMenu';
import { NotificationsPage } from '../../../pages/NotificationsPage';
import { StatusPageSettingsPage } from '../../../pages/StatusPageSettingsPage';
import { server } from '../../../test/msw/server';
import { http, HttpResponse } from 'msw';
import { setAccessToken } from '../../../lib/authTokenStore';

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

describe('Notifications & Status Page Settings — Phase 1', () => {
  beforeEach(() => {
    localStorage.clear();
    setAccessToken('mock-token-admin');
    server.resetHandlers();

    // Default auth mocks for admin user
    server.use(
      http.post('/api/v1/auth/refresh', () => {
        return HttpResponse.json({
          success: true,
          data: { accessToken: 'mock-token-admin' },
        });
      }),
      http.get('/api/v1/auth/me', () => {
        return HttpResponse.json({
          success: true,
          data: {
            user: {
              id: 'u1',
              organizationId: 'o1',
              name: 'Admin User',
              email: 'admin@sentraops.com',
              role: 'admin',
              organization: {
                id: 'o1',
                name: 'Acme Corp',
                slug: 'acme-corp',
              },
            },
          },
        });
      })
    );
  });

  describe('NotificationsMenu (The Bell)', () => {
    it('renders the unread badge and opens panel with real notification items', async () => {
      renderWithProviders(<NotificationsMenu />);

      // The bell button should display the unread count badge (2 unread in mock)
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });

      // Click to open the dropdown
      const bellButton = screen.getByRole('button', { name: /notifications/i });
      await userEvent.click(bellButton);

      // Verify notifications dropdown opened with real items
      expect(screen.getByRole('dialog', { name: /notifications panel/i })).toBeInTheDocument();
      expect(screen.getByText(/Incident: Authentication Latency Spike/i)).toBeInTheDocument();
      expect(screen.getByText(/Maintenance: Database Schema Migration/i)).toBeInTheDocument();
    });

    it('clicking "Mark all as read" marks all notifications read', async () => {
      renderWithProviders(<NotificationsMenu />);

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });

      const bellButton = screen.getByRole('button', { name: /notifications/i });
      await userEvent.click(bellButton);

      const markAllBtn = screen.getByRole('button', { name: /mark all as read/i });
      await userEvent.click(markAllBtn);

      await waitFor(() => {
        expect(screen.queryByText('2')).not.toBeInTheDocument();
      });
    });
  });

  describe('NotificationsPage', () => {
    it('renders notifications table with status filter and derived titles', async () => {
      renderWithProviders(<NotificationsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Incident: Authentication Latency Spike/i)).toBeInTheDocument();
        expect(screen.getByText(/Maintenance: Database Schema Migration/i)).toBeInTheDocument();
      });

      // Filter by status "failed"
      const filterSelect = screen.getByLabelText(/status:/i);
      await userEvent.selectOptions(filterSelect, 'failed');

      await waitFor(() => {
        expect(screen.getByText(/Notification via webhook/i)).toBeInTheDocument();
        expect(screen.queryByText(/Incident: Authentication Latency Spike/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('StatusPageSettingsPage', () => {
    it('loads existing fields and displays the public status page link', async () => {
      renderWithProviders(<StatusPageSettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/subdomain \/ slug/i)).toHaveValue('acme-corp');
        expect(screen.getByLabelText(/custom domain/i)).toHaveValue('status.acme.corp');
        expect(screen.getByLabelText(/theme/i)).toHaveValue('light');
      });

      const publicLink = screen.getByRole('link', { name: /view public status page/i });
      expect(publicLink).toHaveAttribute('href', '/status/acme-corp');
      expect(publicLink).toHaveAttribute('target', '_blank');
    });

    it('allows admin/owner to update settings and shows success toast', async () => {
      renderWithProviders(<StatusPageSettingsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/subdomain \/ slug/i)).toHaveValue('acme-corp');
      });

      const themeSelect = screen.getByLabelText(/theme/i);
      await userEvent.selectOptions(themeSelect, 'dark');

      const saveBtn = screen.getByRole('button', { name: /save settings/i });
      await userEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText(/status page settings saved/i)).toBeInTheDocument();
      });
    });

    it('restricts viewer from editing and displays read-only banner', async () => {
      // Mock user as viewer
      server.use(
        http.get('/api/v1/auth/me', () => {
          return HttpResponse.json({
            success: true,
            data: {
              user: {
                id: 'u2',
                organizationId: 'o1',
                name: 'Viewer User',
                email: 'viewer@sentraops.com',
                role: 'viewer',
                organization: {
                  id: 'o1',
                  name: 'Acme Corp',
                  slug: 'acme-corp',
                },
              },
            },
          });
        })
      );

      renderWithProviders(<StatusPageSettingsPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/viewing these settings in read-only mode/i)
        ).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/subdomain \/ slug/i)).toBeDisabled();
      expect(screen.queryByRole('button', { name: /save settings/i })).not.toBeInTheDocument();
    });
  });
});
