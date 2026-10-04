import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '../../../app/providers/QueryClientProvider';
import { SessionProvider } from '../../../app/providers/SessionProvider';
import { ToastProvider } from '../../../app/providers/ToastProvider';
import { AlertsView } from '../components/AlertsView';
import { setAccessToken } from '../../../lib/authTokenStore';
import { createTestUser, createTestOrganization } from '../../../test/fixtures';
import type { AlertChannel, AlertRule } from '../types/alerts';

const mockChannels: AlertChannel[] = [
  {
    id: 'chan-1',
    organizationId: 'org-1',
    name: 'SRE Slack',
    type: 'slack',
    config: { url: 'https://hooks.slack.com/...****' },
    isActive: true,
    createdAt: '2026-10-04T00:00:00.000Z',
    updatedAt: '2026-10-04T00:00:00.000Z',
  },
  {
    id: 'chan-2',
    organizationId: 'org-1',
    name: 'On-Call Email',
    type: 'email',
    config: { recipients: ['oncall@sentraops.com', 'team@sentraops.com'] },
    isActive: true,
    createdAt: '2026-10-04T00:00:00.000Z',
    updatedAt: '2026-10-04T00:00:00.000Z',
  },
];

const mockRules: AlertRule[] = [
  {
    id: 'rule-1',
    organizationId: 'org-1',
    name: 'Auth API Consecutive Failures',
    trigger: 'service_down_consecutive_failures',
    conditions: { consecutiveFailures: 3 },
    serviceId: 'srv-1',
    projectId: null,
    cooldownSeconds: 300,
    snoozedUntil: null,
    isActive: true,
    createdAt: '2026-10-04T00:00:00.000Z',
    updatedAt: '2026-10-04T00:00:00.000Z',
    lastFiredAt: null,
    channels: [mockChannels[0]],
    service: { id: 'srv-1', name: 'Auth API' },
    project: null,
  },
  {
    id: 'rule-2',
    organizationId: 'org-1',
    name: 'New Staging Bug Alert',
    trigger: 'new_issue_in_environment',
    conditions: { environment: 'staging' },
    serviceId: null,
    projectId: 'proj-1',
    cooldownSeconds: 300,
    snoozedUntil: '2026-10-04T12:00:00.000Z', // currently snoozed
    isActive: true,
    createdAt: '2026-10-04T00:00:00.000Z',
    updatedAt: '2026-10-04T00:00:00.000Z',
    lastFiredAt: '2026-10-04T01:00:00.000Z',
    channels: [mockChannels[1]],
    service: null,
    project: { id: 'proj-1', name: 'Store Backend' },
  },
];

function renderAlertsView() {
  return render(
    <MemoryRouter>
      <QueryClientProvider>
        <SessionProvider>
          <ToastProvider>
            <AlertsView />
          </ToastProvider>
        </SessionProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('Step 2.5: Alerts & Notification Channels UI', () => {
  beforeEach(() => {
    setAccessToken('mock-token');

    server.use(
      http.get('/auth/me', () => {
        return HttpResponse.json({
          success: true,
          data: {
            user: createTestUser({ role: 'owner' }),
            organization: createTestOrganization(),
          },
        });
      }),

      http.get('/api/v1/alert-channels', () => {
        return HttpResponse.json({
          success: true,
          data: mockChannels,
        });
      }),

      http.get('/api/v1/alert-rules', () => {
        return HttpResponse.json({
          success: true,
          data: mockRules,
        });
      }),

      http.get('/api/v1/services', () => {
        return HttpResponse.json({
          success: true,
          data: [{ id: 'srv-1', name: 'Auth API' }],
        });
      }),

      http.get('/api/v1/projects', () => {
        return HttpResponse.json({
          success: true,
          data: [{ id: 'proj-1', name: 'Store Backend' }],
        });
      })
    );
  });

  it('renders the Notification Channels tab with masked URLs', async () => {
    renderAlertsView();

    expect(await screen.findByText('SRE Slack')).toBeInTheDocument();
    expect(screen.getByText('On-Call Email')).toBeInTheDocument();
    expect(screen.getByText('https://hooks.slack.com/...****')).toBeInTheDocument();
    expect(screen.getByText('oncall@sentraops.com, team@sentraops.com')).toBeInTheDocument();
  });

  it('sends a test alert when clicking "Send Test"', async () => {
    const user = userEvent.setup();
    let testCalled = false;

    server.use(
      http.post('/api/v1/alert-channels/chan-1/test', () => {
        testCalled = true;
        return HttpResponse.json({
          success: true,
          message: 'Test alert dispatched successfully to SRE Slack',
        });
      })
    );

    renderAlertsView();

    const testButtons = await screen.findAllByRole('button', { name: /Send Test/i });
    expect(testButtons.length).toBeGreaterThan(0);
    await user.click(testButtons[0]);

    await waitFor(() => {
      expect(testCalled).toBe(true);
    });
  });

  it('switches to Alert Rules tab and displays rules, conditions, and snooze state', async () => {
    const user = userEvent.setup();
    renderAlertsView();

    const rulesTabButton = await screen.findByRole('tab', { name: /Alert Rules/i });
    await user.click(rulesTabButton);

    expect(await screen.findByText('Auth API Consecutive Failures')).toBeInTheDocument();
    expect(screen.getByText('New Staging Bug Alert')).toBeInTheDocument();
    expect(screen.getByText(/Failures ≥ 3/i)).toBeInTheDocument();
    expect(screen.getByText(/Env: staging/i)).toBeInTheDocument();
    expect(screen.getByText(/Snoozed until/i)).toBeInTheDocument();
  });

  it('snoozes an alert rule using 1 Hour preset', async () => {
    const user = userEvent.setup();
    let snoozedUntil: string | null = null;

    server.use(
      http.post('/api/v1/alert-rules/rule-1/snooze', async ({ request }) => {
        const body = (await request.json()) as { until: string };
        snoozedUntil = body.until;
        return HttpResponse.json({
          success: true,
          data: {
            ...mockRules[0],
            snoozedUntil: body.until,
          },
          message: 'Alert rule snoozed successfully',
        });
      })
    );

    renderAlertsView();

    // Switch to rules
    const rulesTabButton = await screen.findByRole('tab', { name: /Alert Rules/i });
    await user.click(rulesTabButton);

    // Click Snooze on unsnoozed rule
    const snoozeButton = await screen.findByRole('button', { name: /^Snooze$/i });
    await user.click(snoozeButton);

    // Modal opens, click "1 Hour"
    const oneHourPreset = await screen.findByRole('button', { name: /1 Hour/i });
    await user.click(oneHourPreset);

    await waitFor(() => {
      expect(snoozedUntil).not.toBeNull();
    });
  });
});
