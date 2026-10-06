import { test, expect } from '@playwright/test';
import { registerTestUser } from '../src/test/fixtures/e2e-auth-helper';

test.describe('Issues & Projects Feature E2E (Phase 2 Step 2.4)', () => {
  test('Issue list view, filtering, and detail navigation', async ({ page }) => {
    await registerTestUser(page);
    await expect(page).toHaveURL('/app');

    const mockIssue = {
      id: 'issue-e2e-1',
      projectId: 'proj-e2e-1',
      organizationId: 'o1',
      fingerprint: 'abcdef1234567890',
      title: 'DatabaseConnectionError: Pool timeout reached',
      type: 'DatabaseConnectionError',
      level: 'error',
      status: 'unresolved',
      environment: 'production',
      firstSeenAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      eventCount: 28,
      userCount: 9,
      isRegression: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      project: { id: 'proj-e2e-1', name: 'Order Processing API', platform: 'node' },
      errorEvents: [
        {
          id: 'evt-e2e-1',
          projectId: 'proj-e2e-1',
          issueId: 'issue-e2e-1',
          type: 'DatabaseConnectionError',
          message: 'Pool timeout reached',
          stack: 'DatabaseConnectionError: Pool timeout reached\n    at query (src/db.js:14:5)',
          environment: 'production',
          level: 'error',
          tags: { db: 'postgres' },
          breadcrumbs: [{ category: 'http', message: 'POST /checkout', timestamp: new Date().toISOString() }],
          occurredAt: new Date().toISOString(),
          receivedAt: new Date().toISOString(),
        },
      ],
    };

    // Route mocks
    await page.route('**/api/v1/projects**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: 'proj-e2e-1', name: 'Order Processing API', platform: 'node', environmentDefault: 'production', createdAt: new Date().toISOString() }],
        }),
      });
    });

    await page.route('**/api/v1/issues/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/events')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: mockIssue.errorEvents }),
        });
      } else if (url.endsWith('/issue-e2e-1')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { issue: mockIssue } }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { issues: [mockIssue] },
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
          }),
        });
      }
    });

    // Navigate to Issues
    await page.goto('/app/issues');
    await expect(page.getByText('DatabaseConnectionError: Pool timeout reached')).toBeVisible();
    await expect(page.getByText('Order Processing API')).toBeVisible();

    // Click into issue detail
    await page.click('text="DatabaseConnectionError: Pool timeout reached"');
    await expect(page).toHaveURL('/app/issues/issue-e2e-1');

    // Verify diagnostic panels
    await expect(page.getByText('Stack Trace')).toBeVisible();
    await expect(page.getByText(/at query \(src\/db\.js:14:5\)/)).toBeVisible();
    await expect(page.getByText('Breadcrumbs (1)')).toBeVisible();
  });

  test('Project setup flow: creates project and displays plaintext API key with instructions', async ({ page }) => {
    await registerTestUser(page);
    await expect(page).toHaveURL('/app');

    const createdProjects: any[] = [];

    await page.route('**/api/v1/projects**', async (route) => {
      const method = route.request().method();
      const url = route.request().url();

      if (url.includes('/keys') && method === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              key: {
                id: 'k-1',
                projectId: 'p-new',
                name: 'Default SDK Key',
                keyPrefix: 'sops_123',
                key: 'sops_abcdef1234567890urlsafe_token_val',
                createdAt: new Date().toISOString(),
              },
            },
          }),
        });
      } else if (method === 'POST') {
        const newProj = {
          id: 'p-new',
          organizationId: 'o1',
          name: 'E2E Microservice',
          platform: 'node',
          environmentDefault: 'production',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        createdProjects.push(newProj);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { project: newProj } }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { projects: createdProjects } }),
        });
      }
    });

    // Navigate to projects settings
    await page.goto('/app/settings/projects');

    // Click Create Project
    await page.click('button:has-text("Create Project"), button:has-text("Create First Project")');

    // Fill form
    await page.fill('input[placeholder*="backend-api"]', 'E2E Microservice');
    await page.click('button:has-text("Create Project")');

    // Project setup modal should appear displaying the plaintext key once
    await expect(page.getByText('sops_abcdef1234567890urlsafe_token_val')).toBeVisible();
    await expect(page.getByText('npm install @sentraops/node')).toBeVisible();
    await expect(page.getByText(/Waiting for first event…/)).toBeVisible();

    // Close setup modal
    await page.click('button:has-text("Done")');
    await expect(page.getByText('E2E Microservice')).toBeVisible();
  });
});
