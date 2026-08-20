import { test, expect } from '@playwright/test';

test.describe('Phase 11 — Public Status Page E2E Suite', () => {
  test('unauthenticated visitor loads public status page without auth network requests or bearer tokens', async ({
    page,
  }) => {
    const authHeaderPresentOnPublicRequests: boolean[] = [];
    const authNetworkUrlsCalled: string[] = [];

    // Listen for network calls right away on test start
    page.on('request', (request) => {
      const url = request.url();
      if (
        url.includes('/api/v1/auth/me') ||
        url.includes('/api/v1/auth/refresh') ||
        url.includes('/api/v1/auth/login')
      ) {
        authNetworkUrlsCalled.push(url);
      }
    });

    // Deterministic API routes for public status page
    await page.route('**/api/v1/status/acme-corp/incidents', async (route) => {
      const authHeader = route.request().headers()['authorization'];
      authHeaderPresentOnPublicRequests.push(Boolean(authHeader));

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { incidents: [] },
        }),
      });
    });

    await page.route('**/api/v1/status/acme-corp/maintenance', async (route) => {
      const authHeader = route.request().headers()['authorization'];
      authHeaderPresentOnPublicRequests.push(Boolean(authHeader));

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { maintenance: [] },
        }),
      });
    });

    await page.route('**/api/v1/status/acme-corp', async (route) => {
      const authHeader = route.request().headers()['authorization'];
      authHeaderPresentOnPublicRequests.push(Boolean(authHeader));

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            settings: {
              id: 'sp-1',
              organizationId: 'o1',
              companyName: 'Acme Corp',
              subdomain: 'acme-corp',
              logoUrl: null,
              theme: null,
            },
            services: [
              { id: 's-1', name: 'Authentication API', currentStatus: 'up', environment: 'production' },
            ],
            openIncidents: [],
            maintenance: [],
          },
        }),
      });
    });

    // 1. Navigate directly to unauthenticated public status overview (no prior login or app boot)
    await page.goto('/status/acme-corp');

    // Verify page renders brand & status banner
    await expect(
      page.getByRole('heading', { name: /acme corp status/i })
    ).toBeVisible();

    await expect(
      page.getByRole('status')
    ).toBeVisible();

    await expect(
      page.getByRole('heading', { name: /all systems operational/i })
    ).toBeVisible();

    await expect(
      page.getByRole('heading', { name: /services status/i })
    ).toBeVisible();

    // 2. CRITICAL STRUCTURAL AUTH-INDEPENDENCE ASSERTIONS:
    // A. Zero public status API request carried an Authorization header
    expect(authHeaderPresentOnPublicRequests.length).toBeGreaterThan(0);
    expect(authHeaderPresentOnPublicRequests.every((val) => val === false)).toBe(true);

    // B. Zero auth/session/refresh network calls occurred anywhere during public status page load
    expect(authNetworkUrlsCalled.length).toBe(0);

    // 3. Test Navigation to Incident History
    await page.getByRole('link', { name: /incident history/i }).click();
    await expect(page).toHaveURL(/\/status\/acme-corp\/incidents/);
    await expect(
      page.getByRole('heading', { name: /incident history/i })
    ).toBeVisible();

    // 4. Test Navigation to Maintenance Schedule
    await page.getByRole('link', { name: /maintenance schedule/i }).click();
    await expect(page).toHaveURL(/\/status\/acme-corp\/maintenance/);
    await expect(
      page.getByRole('heading', { name: /maintenance schedule/i })
    ).toBeVisible();
  });
});
