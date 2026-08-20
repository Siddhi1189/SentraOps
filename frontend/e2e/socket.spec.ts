import { test, expect } from '@playwright/test';
import { registerTestUser } from '../src/test/fixtures/e2e-auth-helper';

test.describe('Phase 12 — Real-Time Infrastructure & Socket Hardening E2E', () => {
  test('unauthenticated visitor cannot access socket-enabled app routes and redirects to /login', async ({
    page,
  }) => {
    await page.goto('/app/services');
    await expect(page).toHaveURL(/\/login/);
  });

  test('graceful degradation when Socket.IO connection is blocked (including /services/:id and /incidents/:id)', async ({ page }) => {
    // 1. Deliberately block Socket.IO network requests
    await page.route('**/socket.io/**', (route) => route.abort());

    // 2. Register test user against live backend and verify Overview Page landing
    await registerTestUser(page);
    await expect(page).toHaveURL('/app');
    await expect(page.getByRole('heading', { level: 1, name: /^overview$/i })).toBeVisible();

    // 3. Setup deterministic REST route handlers using URL pathname predicates (robust against query params)
    const testServiceId = 's-socket-e2e-1';
    const testIncidentId = 'inc-socket-e2e-1';

    const testService = {
      id: testServiceId,
      organizationId: 'o1',
      groupId: null,
      name: 'Payment Processing Service',
      url: 'https://payments.example.com/health',
      httpMethod: 'GET',
      expectedStatusCode: 200,
      timeoutMs: 5000,
      checkIntervalSeconds: 30,
      environment: 'production',
      priority: 'critical',
      currentStatus: 'up',
      consecutiveFailures: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const testIncident = {
      id: testIncidentId,
      organizationId: 'o1',
      serviceId: testServiceId,
      assignedUserId: null,
      title: 'Database Spike Under Peak Load',
      status: 'open',
      severity: 'high',
      rootCause: null,
      resolutionNotes: null,
      detectedAt: new Date().toISOString(),
      resolvedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      service: testService,
    };

    await page.route(
      (url) => url.pathname.includes('/analytics/service/'),
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { uptimePercentage: 99.9, avgResponseTimeMs: 45, totalHealthChecks: 100, failedHealthChecks: 0, totalIncidents: 0, mttrMinutes: 0 },
          }),
        });
      }
    );

    await page.route(
      (url) => url.pathname.includes('/services'),
      async (route) => {
        const path = new URL(route.request().url()).pathname;
        const method = route.request().method();

        if (path.endsWith('/services/groups')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 1 } }),
          });
          return;
        }

        if (path.includes('/health-checks')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 } }),
          });
          return;
        }

        if (path.endsWith('/services') || path.endsWith('/services/')) {
          if (method === 'GET') {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                success: true,
                data: [testService],
                pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
              }),
            });
          } else {
            await route.continue();
          }
          return;
        }

        // Service detail subpath (/services/<id>)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: testService }),
        });
      }
    );

    await page.route(
      (url) => url.pathname.includes('/incidents'),
      async (route) => {
        const path = new URL(route.request().url()).pathname;
        const method = route.request().method();

        if (path.includes('/timeline')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: [] }),
          });
          return;
        }

        if (path.endsWith('/incidents') || path.endsWith('/incidents/')) {
          if (method === 'GET') {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                success: true,
                data: [testIncident],
                pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
              }),
            });
          } else {
            await route.continue();
          }
          return;
        }

        // Incident detail subpath (/incidents/<id>)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: testIncident }),
        });
      }
    );

    // 4. Navigate to /app/services and click into /app/services/:id
    await page.locator('aside nav a[href="/app/services"]').click();
    await expect(page).toHaveURL('/app/services');
    await expect(page.getByRole('heading', { level: 1, name: /services/i })).toBeVisible();

    await expect(page.getByText('Payment Processing Service')).toBeVisible();
    await page.getByRole('link', { name: 'Payment Processing Service' }).click();
    await expect(page).toHaveURL(/\/app\/services\/s-socket-e2e-1/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/payment processing service/i);

    // 5. Navigate to /app/incidents and click into /app/incidents/:id
    await page.locator('aside nav a[href="/app/incidents"]').click();
    await expect(page).toHaveURL('/app/incidents');
    await expect(page.getByRole('heading', { level: 1, name: /incidents/i })).toBeVisible();

    await expect(page.getByText('Database Spike Under Peak Load')).toBeVisible();
    await page.getByRole('link', { name: 'Database Spike Under Peak Load' }).click();
    await expect(page).toHaveURL(/\/app\/incidents\/inc-socket-e2e-1/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/database spike under peak load/i);

    // 6. Navigate to /app/maintenance
    await page.locator('aside nav a[href="/app/maintenance"]').click();
    await expect(page).toHaveURL('/app/maintenance');
    await expect(page.getByRole('heading', { level: 1, name: /maintenance windows/i })).toBeVisible();

    // 7. Navigate to /app/analytics
    await page.locator('aside nav a[href="/app/analytics"]').click();
    await expect(page).toHaveURL('/app/analytics');
    await expect(page.getByRole('heading', { level: 1, name: /analytics/i })).toBeVisible();
  });
});
