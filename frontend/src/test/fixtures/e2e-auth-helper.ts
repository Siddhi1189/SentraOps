import type { Page } from '@playwright/test';

export interface TestUserCredentials {
  organizationName: string;
  name: string;
  email: string;
  password: string;
}

export function generateUniqueTestCredentials(): TestUserCredentials {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  return {
    organizationName: `Test Org ${uniqueId}`,
    name: `Test Owner ${uniqueId}`,
    email: `owner-${uniqueId}@sentraops-test.com`,
    password: `Password123!-${uniqueId}`,
  };
}

export async function registerTestUser(
  page: Page,
  credentials?: Partial<TestUserCredentials>
): Promise<TestUserCredentials> {
  const creds: TestUserCredentials = {
    ...generateUniqueTestCredentials(),
    ...credentials,
  };

  // Intercept registration API request deterministically in Playwright
  await page.route('**/api/v1/auth/register', async (route) => {
    const request = route.request();
    const postData = JSON.parse(request.postData() || '{}');

    const mockOrg = {
      id: '00000000-0000-4000-8000-000000000000',
      name: postData.organizationName || creds.organizationName,
      slug: (postData.organizationName || creds.organizationName).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockUser = {
      id: '11111111-1111-4111-8111-111111111111',
      organizationId: mockOrg.id,
      name: postData.name || creds.name,
      email: postData.email || creds.email,
      role: 'owner',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      organization: mockOrg,
    };

    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          user: mockUser,
          organization: mockOrg,
          accessToken: 'mock-playwright-e2e-token',
        },
      }),
    });
  });

  await page.goto('/register');
  await page.getByLabel(/organization name/i).fill(creds.organizationName);
  await page.getByLabel(/your full name/i).fill(creds.name);
  await page.getByLabel(/email address/i).fill(creds.email);
  await page.locator('input[name="password"]').fill(creds.password);
  await page.getByRole('button', { name: /get started/i }).click();

  return creds;
}
