import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '../../../app/providers/QueryClientProvider';
import { SessionProvider } from '../../../app/providers/SessionProvider';
import { ToastProvider } from '../../../app/providers/ToastProvider';
import { IssuesView } from '../components/IssuesView';
import { IssueDetailPage } from '../../../pages/IssueDetailPage';
import { ProjectSetupModal } from '../components/ProjectSetupModal';
import { setAccessToken } from '../../../lib/authTokenStore';
import { createTestUser, createTestOrganization } from '../../../test/fixtures';
import type { Issue, Project } from '../types/issues';

const mockProject: Project = {
  id: 'proj-1',
  organizationId: 'org-1',
  name: 'Store Backend',
  platform: 'node',
  environmentDefault: 'production',
  createdAt: '2026-10-04T00:00:00.000Z',
  updatedAt: '2026-10-04T00:00:00.000Z',
};

const mockIssue: Issue = {
  id: 'issue-123',
  projectId: 'proj-1',
  organizationId: 'org-1',
  fingerprint: 'abcdef1234567890',
  title: 'TypeError: Cannot read properties of undefined (reading orderId)',
  type: 'TypeError',
  level: 'error',
  status: 'unresolved',
  environment: 'production',
  firstSeenAt: '2026-10-04T01:00:00.000Z',
  lastSeenAt: '2026-10-04T02:00:00.000Z',
  eventCount: 42,
  userCount: 15,
  isRegression: false,
  createdAt: '2026-10-04T01:00:00.000Z',
  updatedAt: '2026-10-04T02:00:00.000Z',
  project: {
    id: 'proj-1',
    name: 'Store Backend',
    platform: 'node',
  },
  errorEvents: [
    {
      id: 'evt-1',
      projectId: 'proj-1',
      issueId: 'issue-123',
      type: 'TypeError',
      message: 'Cannot read properties of undefined (reading orderId)',
      stack: 'TypeError: Cannot read properties of undefined\n    at checkout (src/services/order.js:42:10)',
      environment: 'production',
      level: 'error',
      tags: { runtime: 'node-20', region: 'us-east-1' },
      breadcrumbs: [
        { category: 'http', message: 'POST /api/orders', timestamp: '2026-10-04T02:00:00.000Z' },
        { category: 'console', message: 'Processing order payload', timestamp: '2026-10-04T02:00:00.000Z' },
      ],
      user: { id: 'usr-99', email: 'shopper@example.com' },
      request: { url: 'https://api.store.com/checkout', method: 'POST' },
      occurredAt: '2026-10-04T02:00:00.000Z',
      receivedAt: '2026-10-04T02:00:01.000Z',
    },
  ],
};

function renderWithProviders(component: React.ReactNode, initialEntries = ['/app/issues']) {
  return render(
    <QueryClientProvider>
      <SessionProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={initialEntries}>{component}</MemoryRouter>
        </ToastProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}

describe('Issues UI Feature (Phase 2 Step 2.4)', () => {
  beforeEach(() => {
    setAccessToken('mock-admin-token');
    server.use(
      http.post('*/api/v1/auth/refresh', () => {
        return HttpResponse.json({
          success: true,
          data: { accessToken: 'mock-admin-token' },
        });
      }),
      http.get('*/api/v1/auth/me', () => {
        const org = createTestOrganization();
        const user = createTestUser({ role: 'admin', organizationId: org.id });
        return HttpResponse.json({
          success: true,
          data: { user: { ...user, organization: org } },
        });
      }),
      http.get('*/api/v1/projects', () => {
        return HttpResponse.json({
          success: true,
          data: { projects: [mockProject] },
        });
      }),
      http.get('*/api/v1/issues', () => {
        return HttpResponse.json({
          success: true,
          data: { issues: [mockIssue] },
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        });
      }),
      http.get('*/api/v1/issues/:id', () => {
        return HttpResponse.json({
          success: true,
          data: { issue: mockIssue },
        });
      })
    );
  });

  describe('Issues List Page', () => {
    it('renders issue table with title, event count, and environment', async () => {
      renderWithProviders(<IssuesView />);

      await waitFor(() => {
        expect(
          screen.getByText('TypeError: Cannot read properties of undefined (reading orderId)')
        ).toBeInTheDocument();
      });

      expect(screen.getAllByText('Store Backend').length).toBeGreaterThan(0);
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getAllByText('production').length).toBeGreaterThan(0);
    });
  });

  describe('Issue Detail Page & Actions', () => {
    it('renders stack trace, breadcrumbs, tags, and request context', async () => {
      renderWithProviders(
        <Routes>
          <Route path="/app/issues/:id" element={<IssueDetailPage />} />
        </Routes>,
        ['/app/issues/issue-123']
      );

      await waitFor(() => {
        expect(
          screen.getByRole('heading', {
            name: 'TypeError: Cannot read properties of undefined (reading orderId)',
          })
        ).toBeInTheDocument();
      });

      expect(screen.getByText(/checkout \(src\/services\/order\.js:42:10\)/)).toBeInTheDocument();
      expect(screen.getByText('POST /api/orders')).toBeInTheDocument();
      expect(screen.getByText('node-20')).toBeInTheDocument();
      expect(screen.getByText('shopper@example.com')).toBeInTheDocument();
    });

    it('triggers resolve status mutation when resolve button is clicked', async () => {
      let resolvedPayload: any = null;
      server.use(
        http.patch('*/api/v1/issues/:id', async ({ request }) => {
          resolvedPayload = await request.json();
          return HttpResponse.json({
            success: true,
            data: { issue: { ...mockIssue, status: 'resolved' } },
          });
        })
      );

      renderWithProviders(
        <Routes>
          <Route path="/app/issues/:id" element={<IssueDetailPage />} />
        </Routes>,
        ['/app/issues/issue-123']
      );

      const resolveBtn = await screen.findByRole('button', { name: /resolve/i });
      await userEvent.click(resolveBtn);

      await waitFor(() => {
        expect(resolvedPayload).toEqual(
          expect.objectContaining({
            status: 'resolved',
          })
        );
      });
    });
  });

  describe('Project Setup Screen', () => {
    it('displays full API key once, copy button, and install snippets', () => {
      renderWithProviders(
        <ProjectSetupModal
          isOpen={true}
          onClose={() => {}}
          project={mockProject}
          plainKey="sops_plaintext_secret_key_123"
        />
      );

      expect(screen.getByText('sops_plaintext_secret_key_123')).toBeInTheDocument();
      expect(screen.getByText(/npm install @sentraops\/node/)).toBeInTheDocument();
      expect(screen.getByText(/Waiting for first event…/)).toBeInTheDocument();
    });
  });
});
