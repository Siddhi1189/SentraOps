import { test, expect } from '@playwright/test';
import { registerTestUser } from '../src/test/fixtures/e2e-auth-helper';

test.describe('Authentication & Route Protection E2E', () => {
  test('loads public website at root / with navbar, hero, and CTAs', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { level: 1, name: /monitor\.\s*detect/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /start 14-day free trial|start free trial|get started/i }).first()).toBeVisible();
  });

  test('redirects unauthenticated visitor from protected /app to /login', async ({ page }) => {
    await page.goto('/app');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /welcome back|sign in/i })).toBeVisible();
  });

  test('registers a new user and lands inside app overview on /app with real dashboard content', async ({ page }) => {
    await registerTestUser(page);
    await expect(page).toHaveURL(/\/app/);
    await expect(page.getByRole('heading', { level: 1, name: /^overview$/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'System Health Overview' })).toBeVisible({ timeout: 15000 });
  });
});
