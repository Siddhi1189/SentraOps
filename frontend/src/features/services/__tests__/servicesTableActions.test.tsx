import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '../../../app/providers/QueryClientProvider';
import { SessionProvider } from '../../../app/providers/SessionProvider';
import { ToastProvider } from '../../../app/providers/ToastProvider';
import { ServicesTable } from '../components/ServicesTable';
import { setAccessToken } from '../../../lib/authTokenStore';
import { createTestUser, createTestOrganization, createTestService } from '../../../test/fixtures';

function renderServicesTable(props: Partial<React.ComponentProps<typeof ServicesTable>> = {}) {
  const service = createTestService({
    id: 's-1',
    name: 'Core Payment API',
    currentStatus: 'up',
    url: 'https://api.sentraops.com/pay',
    checkIntervalSeconds: 60,
  });

  const defaultProps = {
    services: [service],
    page: 1,
    limit: 10,
    total: 1,
    onPageChange: vi.fn(),
    onEditService: vi.fn(),
    onDeleteService: vi.fn(),
    ...props,
  };

  return {
    ...render(
      <QueryClientProvider>
        <SessionProvider>
          <ToastProvider>
            <MemoryRouter>
              <ServicesTable {...defaultProps} />
            </MemoryRouter>
          </ToastProvider>
        </SessionProvider>
      </QueryClientProvider>
    ),
    props: defaultProps,
    service,
  };
}

describe('ServicesTable Actions Menu & Delete UX', () => {
  beforeEach(() => {
    setAccessToken('admin-token');
    server.use(
      http.post('/api/v1/auth/refresh', () => {
        return HttpResponse.json({ success: true, data: { accessToken: 'admin-token' } });
      }),
      http.get('/api/v1/auth/me', () => {
        const org = createTestOrganization();
        const user = createTestUser({ role: 'admin', organizationId: org.id });
        return HttpResponse.json({ success: true, data: { user: { ...user, organization: org } } });
      })
    );
  });

  it('renders "⋯" actions button and opens menu containing Edit and Delete', async () => {
    const user = userEvent.setup();
    const { props, service } = renderServicesTable();

    await waitFor(() => {
      expect(screen.getByText('Core Payment API')).toBeInTheDocument();
    });

    const trigger = screen.getByRole('button', { name: `Actions for ${service.name}` });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    // Menu should initially be closed
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    // Open menu
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu')).toBeInTheDocument();

    const editItem = screen.getByRole('menuitem', { name: 'Edit' });
    const deleteItem = screen.getByRole('menuitem', { name: 'Delete' });
    expect(editItem).toBeInTheDocument();
    expect(deleteItem).toBeInTheDocument();

    // Clicking Edit invokes callback and closes menu
    await user.click(editItem);
    expect(props.onEditService).toHaveBeenCalledWith(service);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('clicking Delete in the menu invokes onDeleteService', async () => {
    const user = userEvent.setup();
    const { props, service } = renderServicesTable();

    await waitFor(() => {
      expect(screen.getByText('Core Payment API')).toBeInTheDocument();
    });

    const trigger = screen.getByRole('button', { name: `Actions for ${service.name}` });
    await user.click(trigger);

    const deleteItem = screen.getByRole('menuitem', { name: 'Delete' });
    await user.click(deleteItem);

    expect(props.onDeleteService).toHaveBeenCalledWith(service);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes menu when Escape is pressed', async () => {
    const user = userEvent.setup();
    const { service } = renderServicesTable();

    await waitFor(() => {
      expect(screen.getByText('Core Payment API')).toBeInTheDocument();
    });

    const trigger = screen.getByRole('button', { name: `Actions for ${service.name}` });
    await user.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('omits actions menu completely for viewer role', async () => {
    setAccessToken('viewer-token');
    server.use(
      http.get('/api/v1/auth/me', () => {
        const org = createTestOrganization();
        const user = createTestUser({ role: 'viewer', organizationId: org.id });
        return HttpResponse.json({ success: true, data: { user: { ...user, organization: org } } });
      })
    );

    const { service } = renderServicesTable();

    await waitFor(() => {
      expect(screen.getByText('Core Payment API')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: `Actions for ${service.name}` })).not.toBeInTheDocument();
  });
});
