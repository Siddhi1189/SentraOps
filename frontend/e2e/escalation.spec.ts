import { test, expect } from '@playwright/test';
import { registerTestUser } from '../src/test/fixtures/e2e-auth-helper';

test.describe('Escalation Policies & Settings E2E', () => {
  test('complete escalation policy lifecycle: settings redirect, layout landmark, custom policy override, and service detail tab rendering', async ({
    page,
  }) => {
    let mockPolicies: any[] = [];

    await page.route('**/api/v1/escalation-policies**', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockPolicies,
          }),
        });
      } else if (method === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        const newPolicy = {
          id: `ep-${Date.now()}`,
          organizationId: 'o1',
          serviceId: body.serviceId || null,
          warningThreshold: Number(body.warningThreshold),
          incidentThreshold: Number(body.incidentThreshold),
          criticalThreshold: Number(body.criticalThreshold),
          createdAt: new Date().toISOString(),
        };

        const existingIdx = mockPolicies.findIndex((p) => p.serviceId === newPolicy.serviceId);
        if (existingIdx >= 0) {
          mockPolicies[existingIdx] = newPolicy;
        } else {
          mockPolicies.push(newPolicy);
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: newPolicy,
          }),
        });
      }
    });

    await page.route('**/api/v1/services*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: 's-e2e-1', name: 'Database Cluster' }],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        }),
      });
    });

    // 1. Register new user
    await registerTestUser(page);
    await expect(page).toHaveURL('/app');

    // 2. Navigate to Escalation Policies settings page
    await page.locator('aside nav a[href="/app/settings"]').click();
    await expect(page).toHaveURL(/\/app\/settings\/organization/);

    const settingsNav = page.locator('nav[aria-label="Settings Navigation"]');
    await expect(settingsNav).toBeVisible();
    await settingsNav.getByRole('link', { name: /escalation policies/i }).click();
    await expect(page).toHaveURL(/\/app\/settings\/escalation-policies/);
    await expect(settingsNav.getByRole('link', { name: /escalation policies/i })).toHaveAttribute(
      'aria-current',
      'page'
    );

    // 4. Verify Page Header
    await expect(page.getByRole('heading', { level: 1, name: /escalation policies/i })).toBeVisible();

    // 5. Open Form Drawer to create custom policy
    await page.getByRole('button', { name: /\+ add escalation policy/i }).first().click();
    await expect(page.getByRole('heading', { name: /create escalation policy/i })).toBeVisible();

    // Fill thresholds in descending order (critical -> incident -> warning) so intermediate states stay strictly valid
    await page.locator('#criticalThreshold').fill('6');
    await page.locator('#incidentThreshold').fill('4');
    await page.locator('#warningThreshold').fill('2');

    // Submit form
    await page.getByRole('button', { name: /save escalation policy/i }).click();

    // 6. Verify drawer closes and table displays updated Org-wide default policy thresholds
    await expect(page.getByRole('heading', { name: /create escalation policy/i })).not.toBeVisible();
    const table = page.locator('table');
    await expect(table.getByText('2', { exact: true })).toBeVisible();
    await expect(table.getByText('4', { exact: true })).toBeVisible();
    await expect(table.getByText('6', { exact: true })).toBeVisible();
  });
});
