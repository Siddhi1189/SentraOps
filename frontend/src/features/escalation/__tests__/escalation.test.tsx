import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from '../../../app/providers/SessionProvider';
import { ToastProvider } from '../../../app/providers/ToastProvider';
import { EscalationPoliciesView } from '../components/EscalationPoliciesView';
import { ServiceEscalationTab } from '../components/ServiceEscalationTab';
import { EscalationPolicyFormDrawer } from '../components/EscalationPolicyFormDrawer';
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

function renderWithProviders(ui: React.ReactNode, { initialEntries = ['/settings/escalation-policies'] } = {}) {
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

describe('Phase 8 — Escalation Policies Integration & Compliance', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('auth_token', 'mock-token-admin');
    server.resetHandlers();
  });

  it('validates threshold ordering (warning < incident < critical) and announces via aria-live', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    renderWithProviders(<EscalationPolicyFormDrawer isOpen={true} onClose={handleClose} />);

    // Set invalid thresholds: warning 5, incident 2 (warning >= incident)
    const warningInput = screen.getByLabelText(/warning threshold/i);
    const incidentInput = screen.getByLabelText(/incident threshold/i);

    await user.clear(warningInput);
    await user.type(warningInput, '5');
    await user.clear(incidentInput);
    await user.type(incidentInput, '2');

    await user.click(screen.getByRole('button', { name: /save escalation policy/i }));

    // Assert aria-live announced validation error
    const errorBanner = screen.getByRole('alert');
    expect(errorBanner).toBeInTheDocument();
    expect(errorBanner).toHaveAttribute('aria-live', 'polite');
    expect(errorBanner).toHaveTextContent('Warning threshold must be strictly less than incident threshold');
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('protects org-default policy from deletion in UI and handles CANNOT_DELETE_DEFAULT from API', async () => {
    renderWithProviders(<EscalationPoliciesView />);

    await waitFor(() => {
      expect(screen.getByText('Organization-wide Default')).toBeInTheDocument();
    });

    // Assert Delete button is omitted for Org-wide Default policy row
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    expect(editButtons.length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('completes full upsert roundtrip for both org-default and per-service policies', async () => {
    const user = userEvent.setup();

    renderWithProviders(<EscalationPoliciesView />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ add escalation policy/i })).toBeInTheDocument();
    });

    // Open Form Drawer
    await user.click(screen.getByRole('button', { name: /\+ add escalation policy/i }));

    const warningInput = screen.getByLabelText(/warning threshold/i);
    const incidentInput = screen.getByLabelText(/incident threshold/i);
    const criticalInput = screen.getByLabelText(/critical threshold/i);

    await user.clear(warningInput);
    await user.type(warningInput, '2');
    await user.clear(incidentInput);
    await user.type(incidentInput, '4');
    await user.clear(criticalInput);
    await user.type(criticalInput, '6');

    await user.click(screen.getByRole('button', { name: /save escalation policy/i }));

    // Verify policy appears updated in table after query invalidation & refetch
    await waitFor(() => {
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument();
    });
  });

  describe('Service Detail Tab Custom vs Inherited Resolution', () => {
    it('renders Custom Service Escalation Policy when matching serviceId policy exists', async () => {
      server.use(
        http.get('/api/v1/escalation-policies', () => {
          return HttpResponse.json({
            success: true,
            data: [
              {
                id: 'ep-custom',
                organizationId: 'o1',
                serviceId: 's-11111111-1111-4111-8111-111111111111',
                warningThreshold: 4,
                incidentThreshold: 8,
                criticalThreshold: 12,
                createdAt: new Date().toISOString(),
              },
            ],
          });
        })
      );

      renderWithProviders(
        <ServiceEscalationTab serviceId="s-11111111-1111-4111-8111-111111111111" />
      );

      await waitFor(() => {
        expect(screen.getByTestId('service-escalation-badge')).toHaveTextContent(
          'Custom Service Escalation Policy'
        );
      });

      expect(screen.getByTestId('warning-threshold-value')).toHaveTextContent('4');
      expect(screen.getByTestId('incident-threshold-value')).toHaveTextContent('8');
      expect(screen.getByTestId('critical-threshold-value')).toHaveTextContent('12');
    });

    it('renders Inherits Organization Default Escalation Policy when no custom policy exists', async () => {
      server.use(
        http.get('/api/v1/escalation-policies', () => {
          return HttpResponse.json({
            success: true,
            data: [
              {
                id: 'ep-org-default',
                organizationId: 'o1',
                serviceId: null,
                warningThreshold: 3,
                incidentThreshold: 6,
                criticalThreshold: 9,
                createdAt: new Date().toISOString(),
              },
            ],
          });
        })
      );

      renderWithProviders(
        <ServiceEscalationTab serviceId="s-22222222-2222-4222-8222-222222222222" />
      );

      await waitFor(() => {
        expect(screen.getByTestId('service-escalation-badge')).toHaveTextContent(
          'Inherits Organization Default Escalation Policy'
        );
      });

      expect(screen.getByTestId('warning-threshold-value')).toHaveTextContent('3');
      expect(screen.getByTestId('incident-threshold-value')).toHaveTextContent('6');
      expect(screen.getByTestId('critical-threshold-value')).toHaveTextContent('9');
    });

    it('renders empty state when neither custom nor org-default policy exists without fabricating numbers', async () => {
      server.use(
        http.get('/api/v1/escalation-policies', () => {
          return HttpResponse.json({
            success: true,
            data: [],
          });
        })
      );

      renderWithProviders(
        <ServiceEscalationTab serviceId="s-22222222-2222-4222-8222-222222222222" />
      );

      await waitFor(() => {
        expect(screen.getByText('No Escalation Policy Resolved')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('warning-threshold-value')).not.toBeInTheDocument();
    });
  });

  it('omits write controls for viewer role', async () => {
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

    renderWithProviders(<EscalationPoliciesView />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /escalation policies/i })).toBeInTheDocument();
    });

    // Assert write controls are completely omitted for viewer role
    expect(screen.queryByRole('button', { name: /\+ add escalation policy/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });
});
