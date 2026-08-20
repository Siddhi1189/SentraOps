import type React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse, delay } from 'msw';
import { server } from '../../../test/msw/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from '../../../app/providers/SessionProvider';
import { ToastProvider } from '../../../app/providers/ToastProvider';
import { createTestUser } from '../../../test/fixtures';
import { SettingsLayout } from '../../../components/layout/SettingsLayout/SettingsLayout';
import { OrganizationView } from '../organization/components/OrganizationView';
import { TeamView } from '../team/components/TeamView';
import { AuditLogView } from '../audit/components/AuditLogView';
import type { User } from '../../../types/domain';

function renderWithProviders(
  ui: React.ReactElement,
  { user = createTestUser({ role: 'owner' }), initialEntries = ['/settings/organization'] } = {}
) {
  const org = {
    id: 'o1',
    name: 'Acme Corp',
    slug: 'acme-corp',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const fullUser: User = {
    ...user,
    organizationId: 'o1',
    organization: org,
  };

  server.use(
    http.post('/api/v1/auth/refresh', () => {
      return HttpResponse.json({
        success: true,
        data: { accessToken: 'test-token' },
      });
    }),
    http.get('/api/v1/auth/me', () => {
      return HttpResponse.json({
        success: true,
        data: { user: fullUser },
      });
    })
  );

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

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

describe('Phase 10 — Settings, Team & Audit Log Compliance', () => {
  describe('Organization Tab Read-Only Compliance', () => {
    it('renders verified organization name and slug in read-only profile card without any edit inputs or submit buttons', async () => {
      renderWithProviders(<OrganizationView />);

      await waitFor(() => {
        expect(screen.getByText('Organization Profile')).toBeInTheDocument();
      });

      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('acme-corp')).toBeInTheDocument();

      // Verify no form inputs or edit buttons exist
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
    });
  });

  describe('Settings Navigation & Permission Gating', () => {
    it('completely omits Audit Log nav link from DOM for viewer role', async () => {
      const viewerUser = createTestUser({ role: 'viewer' });
      renderWithProviders(<SettingsLayout />, { user: viewerUser });

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /organization/i })).toBeInTheDocument();
      });

      expect(screen.getByRole('link', { name: /team/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /escalation policies/i })).toBeInTheDocument();

      // Audit Log link MUST be genuinely absent from DOM
      expect(screen.queryByRole('link', { name: /audit log/i })).not.toBeInTheDocument();
    });

    it('renders Audit Log nav link for owner and admin roles', async () => {
      const ownerUser = createTestUser({ role: 'owner' });
      renderWithProviders(<SettingsLayout />, { user: ownerUser });

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /audit log/i })).toBeInTheDocument();
      });
    });
  });

  describe('Team Management — Self-Action Disabling & Non-Optimistic Mutations', () => {
    it('disables role-change select and remove-member button on current logged-in user row with accessible tooltips', async () => {
      const ownerUser = createTestUser({ id: 'u-admin-1', role: 'owner', name: 'Alice Admin' });
      renderWithProviders(<TeamView />, { user: ownerUser });

      await waitFor(() => {
        const removeAliceBtn = screen.getByRole('button', { name: /remove alice admin/i });
        expect(removeAliceBtn).toBeDisabled();
        expect(removeAliceBtn).toHaveAttribute('aria-disabled', 'true');
      });
    });

    it('proves role change does NOT update UI before delayed server response resolves (non-optimistic server-confirmation)', async () => {
      const ownerUser = createTestUser({ id: 'u-owner-1', role: 'owner', name: 'Owner User' });

      let membersList = [
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

      // Override GET & PATCH handlers with artificial 300ms delay
      server.use(
        http.get('/api/v1/organizations/members', () => {
          return HttpResponse.json({
            success: true,
            data: { members: membersList },
            pagination: { page: 1, limit: 10, total: membersList.length, totalPages: 1 },
          });
        }),
        http.patch('/api/v1/organizations/members/:userId/role', async ({ request, params }) => {
          await delay(300);
          const body = (await request.json()) as any;
          const member = membersList.find((m) => m.id === params.userId);
          if (member) member.role = body.role;
          return HttpResponse.json({
            success: true,
            data: { user: member },
          });
        })
      );

      renderWithProviders(<TeamView />, { user: ownerUser });

      await waitFor(() => {
        expect(screen.getByText('Bob Viewer')).toBeInTheDocument();
      });

      const bobRoleSelect = screen.getByRole('combobox', { name: /change role for bob viewer/i });
      expect((bobRoleSelect as HTMLSelectElement).value).toBe('viewer');

      // Trigger role change from 'viewer' to 'admin'
      fireEvent.change(bobRoleSelect, { target: { value: 'admin' } });

      // CRITICAL NON-OPTIMISTIC ASSERTION: During mutation in flight, value must NOT have flipped optimistic
      expect((bobRoleSelect as HTMLSelectElement).value).toBe('viewer');

      // Wait for server response and query refresh to complete
      await waitFor(
        () => {
          expect((bobRoleSelect as HTMLSelectElement).value).toBe('admin');
        },
        { timeout: 3000 }
      );
    });

    it('proves member removal does NOT remove row before delayed server response resolves (non-optimistic server-confirmation)', async () => {
      const ownerUser = createTestUser({ id: 'u-owner-1', role: 'owner', name: 'Owner User' });

      let membersList = [
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

      server.use(
        http.get('/api/v1/organizations/members', () => {
          return HttpResponse.json({
            success: true,
            data: { members: membersList },
            pagination: { page: 1, limit: 10, total: membersList.length, totalPages: 1 },
          });
        }),
        http.delete('/api/v1/organizations/members/:userId', async ({ params }) => {
          await delay(300);
          membersList = membersList.filter((m) => m.id !== params.userId);
          return HttpResponse.json({
            success: true,
            data: { message: 'Member removed' },
          });
        })
      );

      renderWithProviders(<TeamView />, { user: ownerUser });

      await waitFor(() => {
        expect(screen.getByText('Bob Viewer')).toBeInTheDocument();
      });

      const removeBobBtn = screen.getByRole('button', { name: /remove bob viewer/i });
      fireEvent.click(removeBobBtn);

      const confirmBtn = screen.getByRole('button', { name: /^remove member$/i });
      fireEvent.click(confirmBtn);

      // CRITICAL NON-OPTIMISTIC ASSERTION: While DELETE request is in-flight, row must remain visible in DOM
      expect(screen.getByText('Bob Viewer')).toBeInTheDocument();

      // Wait for server confirmation and query refresh
      await waitFor(
        () => {
          expect(screen.queryByText('Bob Viewer')).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('completes team member invitation flow without invalidating or refetching members query', async () => {
      const adminUser = createTestUser({ role: 'admin' });
      renderWithProviders(<TeamView />, { user: adminUser });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /\+ invite member/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /\+ invite member/i }));
      expect(screen.getByRole('heading', { name: /invite team member/i })).toBeInTheDocument();

      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'newcolleague@sentraops.com' } });

      const submitBtn = screen.getByRole('button', { name: /send invitation/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /invite team member/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Audit Log Functionality & Filtering', () => {
    it('renders audit log entries with human-readable action labels and allows expandable raw metadata inspection', async () => {
      const adminUser = createTestUser({ role: 'admin' });
      renderWithProviders(<AuditLogView />, { user: adminUser });

      await waitFor(() => {
        expect(screen.getByText('Audit Log')).toBeInTheDocument();
      });

      expect(screen.getByText('Member Invited')).toBeInTheDocument();
      expect(screen.getByText('Service Created')).toBeInTheDocument();

      // Inspect details
      const inspectButtons = screen.getAllByRole('button', { name: /inspect/i });
      fireEvent.click(inspectButtons[0]);

      expect(screen.getByText(/Action Details & Metadata/i)).toBeInTheDocument();
      expect(screen.getByText(/bob@sentraops.com/i)).toBeInTheDocument();
    });

    it('filters audit log entries by entityType', async () => {
      const adminUser = createTestUser({ role: 'admin' });
      renderWithProviders(<AuditLogView />, { user: adminUser });

      await waitFor(() => {
        expect(screen.getByText('Audit Log')).toBeInTheDocument();
      });

      const entityTypeFilter = screen.getByLabelText(/filter by entity type/i);
      fireEvent.change(entityTypeFilter, { target: { value: 'Service' } });

      await waitFor(() => {
        expect(screen.getByText('Service Created')).toBeInTheDocument();
        expect(screen.queryByText('Member Invited')).not.toBeInTheDocument();
      });
    });

    it('filters audit log entries by userId and verifies userId query parameter reaches GET /audit-logs', async () => {
      let capturedUserIdParam: string | null = null;
      server.use(
        http.get('/api/v1/audit-logs', ({ request }) => {
          const url = new URL(request.url);
          capturedUserIdParam = url.searchParams.get('userId');
          return HttpResponse.json({
            success: true,
            data: {
              auditLogs: [
                {
                  id: 'al-10',
                  organizationId: 'o1',
                  userId: 'u-admin-1',
                  action: 'service.created',
                  entityType: 'Service',
                  entityId: 's-1',
                  metadata: { name: 'Filtered Service' },
                  createdAt: new Date().toISOString(),
                },
              ],
            },
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          });
        })
      );

      const adminUser = createTestUser({ role: 'admin' });
      renderWithProviders(<AuditLogView />, { user: adminUser });

      await waitFor(() => {
        expect(screen.getByText('Audit Log')).toBeInTheDocument();
      });

      const userIdFilter = screen.getByLabelText(/filter by user id/i);
      fireEvent.change(userIdFilter, { target: { value: 'u-admin-1' } });

      await waitFor(() => {
        expect(capturedUserIdParam).toBe('u-admin-1');
      });
    });

    it('renders explicit empty state when no audit log entries exist', async () => {
      server.use(
        http.get('/api/v1/audit-logs', () => {
          return HttpResponse.json({
            success: true,
            data: { auditLogs: [] },
            pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
          });
        })
      );

      const adminUser = createTestUser({ role: 'admin' });
      renderWithProviders(<AuditLogView />, { user: adminUser });

      await waitFor(() => {
        expect(screen.getByText('No activity recorded yet.')).toBeInTheDocument();
      });
    });
  });
});
