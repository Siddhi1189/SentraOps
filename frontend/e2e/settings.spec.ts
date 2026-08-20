import { test, expect } from '@playwright/test';
import { registerTestUser } from '../src/test/fixtures/e2e-auth-helper';

test.describe('Settings Feature E2E — Organization, Team & Audit Log', () => {
  test('complete settings workflow: organization read-only card, team member management, invite modal, and audit log inspection', async ({
    page,
  }) => {
    // 1. Intercept Settings, Organization, Team, and Audit Log API endpoints
    await page.route('**/api/v1/organizations', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              organization: {
                id: 'o1',
                name: 'Acme Corp',
                slug: 'acme-corp',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            },
          }),
        });
      }
    });

    let mockMembers = [
      {
        id: 'u-owner-1',
        organizationId: 'o1',
        name: 'Test Owner',
        email: 'owner@sentraops.com',
        role: 'owner',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'u-viewer-1',
        organizationId: 'o1',
        name: 'Bob Viewer',
        email: 'bob@sentraops.com',
        role: 'viewer',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    await page.route('**/api/v1/organizations/members*', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { members: mockMembers },
            pagination: { page: 1, limit: 10, total: mockMembers.length, totalPages: 1 },
          }),
        });
      }
    });

    await page.route('**/api/v1/organizations/invite', async (route) => {
      if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { email: body.email, role: body.role, status: 'invited' },
          }),
        });
      }
    });

    await page.route('**/api/v1/audit-logs*', async (route) => {
      const url = new URL(route.request().url());
      const entityType = url.searchParams.get('entityType');

      let logs = [
        {
          id: 'al-1',
          organizationId: 'o1',
          userId: 'u-owner-1',
          action: 'member.invited',
          entityType: 'User',
          entityId: 'u-viewer-1',
          metadata: { email: 'bob@sentraops.com', role: 'viewer' },
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          user: { id: 'u-owner-1', name: 'Test Owner', email: 'owner@sentraops.com' },
        },
        {
          id: 'al-2',
          organizationId: 'o1',
          userId: 'u-owner-1',
          action: 'service.created',
          entityType: 'Service',
          entityId: 's-111',
          metadata: { name: 'Authentication API', environment: 'production' },
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          user: { id: 'u-owner-1', name: 'Test Owner', email: 'owner@sentraops.com' },
        },
      ];

      if (entityType) {
        logs = logs.filter((l) => l.entityType === entityType);
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { auditLogs: logs },
          pagination: { page: 1, limit: 10, total: logs.length, totalPages: 1 },
        }),
      });
    });

    // 2. Register user & navigate to settings
    await registerTestUser(page);
    // 2. Navigate to /app/settings via sidebar nav
    await page.locator('aside nav a[href="/app/settings"]').click();
    await expect(page).toHaveURL(/\/app\/settings\/organization/);

    // 3. Organization Tab Verification (Read-Only)
    await expect(page.getByRole('heading', { level: 1, name: 'Organization Profile' })).toBeVisible();
    await expect(page.getByText('Acme Corp', { exact: true })).toBeVisible();
    await expect(page.getByText('acme-corp', { exact: true })).toBeVisible();
    await expect(page.locator('main form input, main [role="form"] input')).not.toBeVisible();

    // 4. Team Tab Verification
    const teamTab = page.getByRole('link', { name: /team/i });
    await teamTab.click();
    await expect(page).toHaveURL('/app/settings/team');
    await expect(page.getByRole('heading', { level: 1, name: /team members/i })).toBeVisible();
    await expect(page.getByText('Bob Viewer')).toBeVisible();

    // 5. Invite Member Flow
    const inviteBtn = page.getByRole('button', { name: /\+ invite member/i });
    await inviteBtn.click();
    await expect(page.getByRole('heading', { name: /invite team member/i })).toBeVisible();

    const emailInput = page.getByLabel(/email address/i);
    await emailInput.fill('newmember@sentraops.com');

    const submitInviteBtn = page.getByRole('button', { name: /send invitation/i });
    await submitInviteBtn.click();

    await expect(page.getByRole('heading', { name: /invite team member/i })).not.toBeVisible();
    await expect(page.getByText(/invitation sent successfully/i)).toBeVisible();

    // 6. Audit Log Tab Verification
    const auditTab = page.locator('nav[aria-label="Settings Navigation"]').getByRole('link', { name: /audit log/i });
    await auditTab.click();
    await expect(page).toHaveURL('/app/settings/audit-log');

    await expect(page.getByRole('heading', { level: 1, name: /audit log/i })).toBeVisible();
    await expect(page.getByText('Member Invited')).toBeVisible();
    await expect(page.getByText('Service Created')).toBeVisible();

    // Filter by Entity Type
    const entityFilter = page.getByLabel(/filter by entity type/i);
    await entityFilter.selectOption('Service');

    await expect(page.getByText('Service Created')).toBeVisible();
    await expect(page.getByText('Member Invited')).not.toBeVisible();

    // Filter by User ID
    const userIdFilter = page.getByLabel(/filter by user id/i);
    await expect(userIdFilter).toBeVisible();
    await userIdFilter.fill('u-owner-1');

    // Inspect Metadata
    const inspectBtn = page.getByRole('button', { name: /inspect/i }).first();
    await inspectBtn.click();
    await expect(page.getByText(/action details & metadata/i)).toBeVisible();
    await expect(page.getByText(/Authentication API/i)).toBeVisible();
  });
});
