import { test, expect } from '@playwright/test';
import { registerTestUser } from '../src/test/fixtures/e2e-auth-helper';

test.describe('Maintenance Feature E2E', () => {
  test('complete maintenance lifecycle: schedule window, view detail, edit, delete', async ({
    page,
  }) => {
    // 1. Register test user and land inside app
    await registerTestUser(page);
    await expect(page).toHaveURL('/app');

    const maintenanceId = 'mw-e2e-1001';

    let mockMaintenanceStore = [
      {
        id: maintenanceId,
        organizationId: 'o1',
        serviceId: null,
        title: 'Primary Database Maintenance',
        description: 'Routine index rebuild and vacuuming.',
        startTime: '2026-08-25T10:00:00.000Z',
        endTime: '2026-08-25T12:00:00.000Z',
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        service: null,
      },
    ];

    // Intercept API routes deterministically
    await page.route('**/api/v1/services**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: 's-e2e-1', name: 'Database Service' }],
          pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
        }),
      });
    });

    await page.route('**/api/v1/maintenance**', async (route) => {
      const url = new URL(route.request().url());
      const method = route.request().method();

      if (url.pathname.includes(`/maintenance/${maintenanceId}`)) {
        if (method === 'GET') {
          const item = mockMaintenanceStore.find((m) => m.id === maintenanceId);
          if (!item) {
            await route.fulfill({ status: 404, body: JSON.stringify({ success: false }) });
            return;
          }
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: item }),
          });
        } else if (method === 'PATCH') {
          const postData = JSON.parse(route.request().postData() || '{}');
          const item = mockMaintenanceStore.find((m) => m.id === maintenanceId);
          if (item) {
            if (postData.title) item.title = postData.title;
            if (postData.description !== undefined) item.description = postData.description;
          }
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: item }),
          });
        } else if (method === 'DELETE') {
          mockMaintenanceStore = mockMaintenanceStore.filter((m) => m.id !== maintenanceId);
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: { message: 'Deleted' } }),
          });
        }
        return;
      }

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockMaintenanceStore,
            pagination: { page: 1, limit: 10, total: mockMaintenanceStore.length, totalPages: 1 },
          }),
        });
      } else if (method === 'POST') {
        const postData = JSON.parse(route.request().postData() || '{}');
        const newWin = {
          id: `mw-e2e-${Date.now()}`,
          organizationId: 'o1',
          serviceId: postData.serviceId || null,
          title: postData.title,
          description: postData.description || null,
          startTime: postData.startTime,
          endTime: postData.endTime,
          status: 'scheduled',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          service: null,
        };
        mockMaintenanceStore.push(newWin);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: newWin }),
        });
      }
    });

    // 2. Navigate to /app/maintenance via top-level nav link
    await page.locator('aside nav a[href="/app/maintenance"]').click();
    await expect(page).toHaveURL('/app/maintenance');

    // 3. Verify Table Item
    await expect(page.getByText('Primary Database Maintenance')).toBeVisible();

    // 4. Open Detail Page
    await page.getByText('Primary Database Maintenance').click();
    await expect(page).toHaveURL(`/app/maintenance/${maintenanceId}`);

    // 5. Verify Detail Display
    await expect(page.getByRole('heading', { name: 'Primary Database Maintenance' })).toBeVisible();
    await expect(page.getByText('Organization-wide')).toBeVisible();

    // 6. Click Edit and update description
    await page.getByRole('button', { name: /edit/i }).click();
    await page.getByLabel(/description/i).fill('Updated maintenance description for vacuuming.');
    await page.getByRole('button', { name: /save changes/i }).click();

    // 7. Verify Toast & Updated Content
    await expect(page.getByText(/maintenance window updated successfully/i)).toBeVisible();

    // 8. Delete Maintenance Window
    await page.getByRole('button', { name: /delete/i }).click();
    await page.getByRole('button', { name: /delete maintenance window/i }).click();

    // 9. Verify navigation back to /app/maintenance list
    await expect(page).toHaveURL('/app/maintenance');
  });
});
