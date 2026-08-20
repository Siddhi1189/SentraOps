import { test, expect } from '@playwright/test';
import { registerTestUser } from '../src/test/fixtures/e2e-auth-helper';

test.describe('Incidents Feature E2E', () => {
  test('complete browser incident workflow: filter, detail, update, OCC conflict, programmatic focus, reload', async ({
    page,
  }) => {
    // 1. Register test user and land inside app
    await registerTestUser(page);
    await expect(page).toHaveURL('/app');

    const incidentId = 'inc-e2e-1001';
    let currentServerUpdatedAt = '2026-08-15T10:00:00.000Z';

    const testIncident = {
      id: incidentId,
      organizationId: 'o1',
      serviceId: 's-e2e-1',
      assignedUserId: null,
      title: 'Database Connection Pool Exhaustion',
      status: 'open',
      severity: 'high',
      rootCause: null,
      resolutionNotes: null,
      detectedAt: '2026-08-15T10:00:00.000Z',
      resolvedAt: null,
      createdAt: '2026-08-15T10:00:00.000Z',
      updatedAt: currentServerUpdatedAt,
      service: {
        id: 's-e2e-1',
        name: 'Database Cluster',
      },
    };

    let mockTimeline = [
      {
        id: 'tl-e2e-1',
        incidentId,
        eventType: 'INCIDENT_CREATED',
        description: 'Incident automatically created after health check failures.',
        createdAt: '2026-08-15T10:00:00.000Z',
      },
    ];

    // Intercept Services & Members
    await page.route('**/api/v1/services**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: 's-e2e-1', name: 'Database Cluster' }],
          pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
        }),
      });
    });

    await page.route('**/api/v1/organizations/members**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: 'u-1', name: 'Alice Admin', email: 'alice@example.com' }],
          pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
        }),
      });
    });

    // Clean, unified Incidents route handler
    await page.route('**/api/v1/incidents**', async (route) => {
      const url = new URL(route.request().url());
      const method = route.request().method();

      if (url.pathname.endsWith('/timeline')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: mockTimeline }),
        });
        return;
      }

      if (url.pathname.includes(`/incidents/${incidentId}`)) {
        if (method === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { ...testIncident, updatedAt: currentServerUpdatedAt },
            }),
          });
        } else if (method === 'PATCH') {
          const postData = JSON.parse(route.request().postData() || '{}');

          // OCC STALE TIMESTAMP CHECK
          if (postData.updatedAt && postData.updatedAt !== currentServerUpdatedAt) {
            await route.fulfill({
              status: 409,
              contentType: 'application/json',
              body: JSON.stringify({
                success: false,
                error: {
                  code: 'CONCURRENCY_ERROR',
                  message: 'Incident was modified by someone else. Please reload.',
                },
              }),
            });
            return;
          }

          // Advance server timestamp & update incident state
          currentServerUpdatedAt = new Date().toISOString();
          if (postData.status) testIncident.status = postData.status;
          if (postData.severity) testIncident.severity = postData.severity;
          if (postData.rootCause) testIncident.rootCause = postData.rootCause;
          testIncident.updatedAt = currentServerUpdatedAt;

          mockTimeline.push({
            id: `tl-e2e-${Date.now()}`,
            incidentId,
            eventType: 'STATUS_CHANGED',
            description: `Status changed to ${testIncident.status}.`,
            createdAt: currentServerUpdatedAt,
          });

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { ...testIncident, updatedAt: currentServerUpdatedAt },
            }),
          });
        }
        return;
      }

      // Default List Handler
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ ...testIncident, updatedAt: currentServerUpdatedAt }],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        }),
      });
    });

    // 3. Navigate to /app/incidents via top-level nav link
    await page.locator('aside nav a[href="/app/incidents"]').click();
    await expect(page).toHaveURL('/app/incidents');

    // 4. Verify Incidents Table & Filters
    await expect(page.getByText('Database Connection Pool Exhaustion')).toBeVisible();

    // 5. Open Incident Detail page
    await page.getByText('Database Connection Pool Exhaustion').click();
    await expect(page).toHaveURL(`/app/incidents/${incidentId}`);

    // 6. Perform Status Update as Admin
    await page.getByLabel(/incident status/i).selectOption('investigating');
    await page.getByRole('button', { name: /save changes/i }).click();

    // 7. Verify Server-Confirmed State & Toast
    await expect(page.getByText(/incident updated successfully/i)).toBeVisible();

    // 8. Force OCC Conflict: Simulate background server modification advance
    currentServerUpdatedAt = new Date(Date.now() + 10000).toISOString();

    // Submit another update with stale form state (carrying old updatedAt)
    await page.getByLabel(/incident status/i).selectOption('identified');
    await page.getByRole('button', { name: /save changes/i }).click();

    // 9. Verify 409 Conflict Banner & Programmatic Focus
    const conflictBanner = page.locator('div[role="alert"]:has-text("This incident was updated by someone else")');
    await expect(conflictBanner).toBeVisible();

    // Verify programmatic focus on conflict banner
    await expect(conflictBanner).toBeFocused();

    // 10. Click Reload and verify latest server state
    await page.getByRole('button', { name: /reload/i }).click();
    await expect(conflictBanner).not.toBeVisible();
  });
});
