import { test, expect } from '@playwright/test';
import { registerTestUser } from '../src/test/fixtures/e2e-auth-helper';

test.describe('Application Shell & Navigation E2E', () => {
  test('navigates between all six top-level routes with correct active nav highlighting', async ({
    page,
  }) => {
    await registerTestUser(page);

    // Initial state: /app (Overview)
    await expect(page).toHaveURL('/app');
    await expect(page.locator('aside nav a[href="/app"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('heading', { level: 1, name: /^overview$/i })).toBeVisible();

    // Navigate to /app/services
    await page.locator('aside nav a[href="/app/services"]').click();
    await expect(page).toHaveURL('/app/services');
    await expect(page.locator('aside nav a[href="/app/services"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('heading', { level: 1, name: /services/i })).toBeVisible();

    // Navigate to /app/incidents
    await page.locator('aside nav a[href="/app/incidents"]').click();
    await expect(page).toHaveURL('/app/incidents');
    await expect(page.locator('aside nav a[href="/app/incidents"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('heading', { level: 1, name: /incidents/i })).toBeVisible();

    // Navigate to /app/maintenance
    await page.locator('aside nav a[href="/app/maintenance"]').click();
    await expect(page).toHaveURL('/app/maintenance');
    await expect(page.locator('aside nav a[href="/app/maintenance"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('heading', { level: 1, name: /maintenance windows/i })).toBeVisible();

    // Navigate to /app/analytics
    await page.locator('aside nav a[href="/app/analytics"]').click();
    await expect(page).toHaveURL('/app/analytics');
    await expect(page.locator('aside nav a[href="/app/analytics"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('heading', { level: 1, name: /analytics/i })).toBeVisible();

    // Navigate to /app/settings (redirects to /app/settings/organization)
    await page.locator('aside nav a[href="/app/settings"]').click();
    await expect(page).toHaveURL(/\/app\/settings\/organization/);
    await expect(page.locator('aside nav a[href="/app/settings"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('heading', { name: /organization/i }).first()).toBeVisible();

    // Browser back/forward navigation
    await page.goBack();
    await expect(page).toHaveURL('/app/analytics');
    await expect(page.locator('aside nav a[href="/app/analytics"]')).toHaveAttribute('aria-current', 'page');

    await page.goForward();
    await expect(page).toHaveURL(/\/app\/settings\/organization/);
    await expect(page.locator('aside nav a[href="/app/settings"]')).toHaveAttribute('aria-current', 'page');
  });

  test('OrgUserMenu displays session user/org info and signs out', async ({ page }) => {
    await registerTestUser(page);

    // Open User Dropdown Menu using exact accessible label
    const userMenuButton = page.getByRole('button', { name: /user and organization menu/i });
    await expect(userMenuButton).toBeVisible();
    await userMenuButton.click();
    await expect(page.getByRole('menu')).toBeVisible();

    // Verify sign out button exists
    const signOutBtn = page.getByRole('menuitem', { name: /sign out/i });
    await expect(signOutBtn).toBeVisible();

    // Click sign out
    await signOutBtn.click();

    // Assert redirected to /login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /welcome back|sign in/i })).toBeVisible();
  });

  test('Regression: Public navbar Resources hover dropdown is stable and clickable', async ({ page }) => {
    await page.goto('/');

    const resourcesTrigger = page.getByRole('button', { name: /resources/i });
    await expect(resourcesTrigger).toBeVisible();

    // Trigger dropdown opening
    await resourcesTrigger.click();

    // Verify dropdown menu is open and contains links
    const aboutLink = page.locator('a[href="/about"]').first();
    await expect(aboutLink).toBeVisible();

    // Move cursor into dropdown panel and click the link
    await aboutLink.click();

    // Assert successfully navigated to /about
    await expect(page).toHaveURL(/\/about/);
    await expect(page.getByRole('heading', { level: 1, name: /building the foundation for calm/i })).toBeVisible();
  });

  test('Regression: Dashboard top bar notification bell opens interactive notification menu', async ({ page }) => {
    await registerTestUser(page);
    await expect(page).toHaveURL('/app');

    // Locate the notification bell button in top bar
    const bellBtn = page.getByRole('button', { name: /notifications/i });
    await expect(bellBtn).toBeVisible();

    // Click to open notification panel
    await bellBtn.click();

    // Assert notification menu header and view all link become visible
    await expect(page.getByRole('heading', { level: 3, name: 'Notifications' })).toBeVisible();
    await expect(page.getByRole('link', { name: /view all incidents/i })).toBeVisible();
  });
});
