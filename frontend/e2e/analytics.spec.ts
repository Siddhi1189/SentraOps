import { test, expect } from '@playwright/test';
import { registerTestUser } from '../src/test/fixtures/e2e-auth-helper';

test.describe('Analytics Feature E2E', () => {
  test('complete analytics workflow: standalone incident analytics page with service filtering and lazy service detail analytics tab', async ({
    page,
  }) => {
    const fullMockService = {
      id: 's-e2e-1',
      organizationId: 'o1',
      groupId: null,
      name: 'Database Cluster',
      url: 'https://db.example.com/health',
      httpMethod: 'GET',
      expectedStatusCode: 200,
      timeoutMs: 5000,
      checkIntervalSeconds: 30,
      environment: 'production',
      priority: 'high',
      currentStatus: 'up',
      consecutiveFailures: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Intercept Analytics & Service API endpoints deterministically with exact route matching
    await page.route('**/api/v1/analytics/incidents*', async (route) => {
      const url = new URL(route.request().url());
      const serviceId = url.searchParams.get('serviceId');

      if (serviceId) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              totalIncidents: 3,
              resolvedIncidents: 2,
              mttrSeconds: 900,
              mttrHuman: '15m 0s',
              severityDistribution: { low: 1, medium: 1, high: 1, critical: 0 },
              statusDistribution: { open: 0, investigating: 1, identified: 0, monitoring: 0, resolved: 2 },
            },
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            totalIncidents: 12,
            resolvedIncidents: 9,
            mttrSeconds: 2340.5,
            mttrHuman: '39m 0s',
            severityDistribution: { low: 2, medium: 5, high: 4, critical: 1 },
            statusDistribution: { open: 1, investigating: 1, identified: 1, monitoring: 0, resolved: 9 },
          },
        }),
      });
    });

    await page.route('**/api/v1/analytics/services/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            serviceId: 's-e2e-1',
            rolling7Days: { uptimePercent: 99.85, avgLatency: 142.3, failureCount: 2, totalCount: 1340 },
            rolling30Days: { uptimePercent: 99.91, avgLatency: 138.5, failureCount: 5, totalCount: 5760 },
            rolling90Days: { uptimePercent: 99.95, avgLatency: 135.2, failureCount: 8, totalCount: 17280 },
          },
        }),
      });
    });

    await page.route('**/api/v1/escalation-policies*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
        }),
      });
    });

    await page.route('**/api/v1/services/groups*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
          pagination: { page: 1, limit: 100, total: 0, totalPages: 1 },
        }),
      });
    });

    await page.route('**/api/v1/services/s-e2e-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: fullMockService,
        }),
      });
    });

    await page.route('**/api/v1/services*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [fullMockService],
          pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
        }),
      });
    });

    // 2. Register user
    await registerTestUser(page);
    await expect(page).toHaveURL('/app');

    // 3. Navigate to /app/analytics via top-level nav link
    await page.locator('aside nav a[href="/app/analytics"]').click();
    await expect(page).toHaveURL('/app/analytics');

    // 4. Verify Incident Analytics page elements using exact text match
    await expect(page.getByRole('heading', { level: 1, name: /incident analytics/i })).toBeVisible();
    await expect(page.getByText('Total Incidents', { exact: true })).toBeVisible();
    await expect(page.getByText('Resolved Incidents', { exact: true })).toBeVisible();
    await expect(page.getByText('Mean Time to Resolve (MTTR)', { exact: true })).toBeVisible();

    // 5. Verify Service Filter dropdown and test filter change
    const serviceFilter = page.getByLabel(/filter by service/i);
    await expect(serviceFilter).toBeVisible();

    // Wait for service option to populate
    await expect(page.locator('select option[value="s-e2e-1"]')).toBeAttached();
    await serviceFilter.selectOption('s-e2e-1');
    await expect(page.getByText('15m 0s', { exact: true })).toBeVisible();

    // Reset filter
    await serviceFilter.selectOption('');
    await expect(page.getByText('39m 0s', { exact: true })).toBeVisible();

    // 6. Navigate to /app/services and open service detail page
    await page.locator('aside nav a[href="/app/services"]').click();
    await expect(page).toHaveURL('/app/services');

    await page.getByText('Database Cluster').click();
    await expect(page).toHaveURL(/\/app\/services\/s-e2e-1/);

    // 7. Verify Service Detail Analytics tab is unselected by default
    const analyticsTab = page.getByRole('tab', { name: /analytics/i });
    await expect(analyticsTab).toBeVisible();
    await expect(analyticsTab).toHaveAttribute('aria-selected', 'false');

    // 8. Click Analytics tab to activate lazy loading
    await analyticsTab.click();
    await expect(analyticsTab).toHaveAttribute('aria-selected', 'true');

    // 9. Verify Uptime & Latency rolling windows render
    await expect(page.getByText(/rolling 7 days/i)).toBeVisible();
    await expect(page.getByText(/rolling 30 days/i)).toBeVisible();
    await expect(page.getByText(/rolling 90 days/i)).toBeVisible();
  });
});
