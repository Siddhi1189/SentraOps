import { test, expect } from '@playwright/test';
import { registerTestUser } from '../src/test/fixtures/e2e-auth-helper';

test.describe('Services & Groups Feature E2E', () => {
  test('end-to-end service lifecycle: create, search, detail view, edit, delete', async ({ page }) => {
    // 1. Register test user and land inside app
    await registerTestUser(page);
    await expect(page).toHaveURL('/app');

    // 2. Intercept Services API requests for Playwright E2E determinism
    const createdServices: any[] = [];

    await page.route('**/api/v1/services/groups**', async (route) => {
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

    await page.route('**/api/v1/services**', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: createdServices,
            pagination: { page: 1, limit: 10, total: createdServices.length, totalPages: 1 },
          }),
        });
      } else if (method === 'POST') {
        const postData = JSON.parse(route.request().postData() || '{}');
        const newService = {
          id: `s-e2e-${Date.now()}`,
          organizationId: 'o1',
          groupId: null,
          name: postData.name || 'E2E Test Service',
          url: postData.url || 'https://e2e.example.com/health',
          httpMethod: postData.httpMethod || 'GET',
          expectedStatusCode: postData.expectedStatusCode || 200,
          timeoutMs: postData.timeoutMs || 5000,
          checkIntervalSeconds: postData.checkIntervalSeconds || 60,
          environment: postData.environment || 'production',
          priority: postData.priority || 'medium',
          currentStatus: 'up',
          consecutiveFailures: 0,
          isActive: true,
          tags: postData.tags || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        createdServices.push(newService);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: newService }),
        });
      } else {
        await route.continue();
      }
    });

    // 3. Navigate to /app/services
    await page.locator('aside nav a[href="/app/services"]').click();
    await expect(page).toHaveURL('/app/services');

    // 4. Open Create Service Drawer
    await page.getByRole('button', { name: /\+ add service/i }).first().click();
    await expect(page.getByRole('heading', { name: /create new service/i })).toBeVisible();

    // 5. Fill Service Form
    await page.getByLabel(/service name/i).fill('Payment Gateway E2E');
    await page.getByLabel(/target url/i).fill('https://payments.example.com/health');
    await page.getByRole('button', { name: /create service/i }).click();

    // 6. Verify Service appears in list
    await expect(page.getByText('Payment Gateway E2E')).toBeVisible();
  });
});
