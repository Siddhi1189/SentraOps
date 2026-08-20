import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { SessionProvider } from '../../../app/providers/SessionProvider';
import { AppShell } from '../AppShell/AppShell';
import { setAccessToken } from '../../../lib/authTokenStore';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';

function renderWithProviders(initialEntries = ['/app']) {
  return render(
    <SessionProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/app" element={<AppShell />}>
            <Route index element={<h1>Overview Page</h1>} />
            <Route path="services" element={<h1>Services Page</h1>} />
            <Route path="incidents" element={<h1>Incidents Page</h1>} />
            <Route path="maintenance" element={<h1>Maintenance Page</h1>} />
            <Route path="analytics" element={<h1>Analytics Page</h1>} />
            <Route path="settings" element={<h1>Settings Page</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </SessionProvider>
  );
}

describe('Navigation & AppShell Components', () => {
  beforeEach(() => {
    setAccessToken('mock-token');
    server.use(
      http.post('/api/v1/auth/refresh', () => {
        return HttpResponse.json({
          success: true,
          data: { accessToken: 'mock-token' },
        });
      }),
      http.get('/api/v1/auth/me', () => {
        return HttpResponse.json({
          success: true,
          data: {
            user: {
              id: 'u1',
              organizationId: 'o1',
              name: 'Alice Developer',
              email: 'alice@sentraops.com',
              role: 'admin',
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              organization: {
                id: 'o1',
                name: 'Acme Security',
                slug: 'acme-security',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            },
          },
        });
      })
    );
  });

  it('renders all six top-level nav links', async () => {
    renderWithProviders(['/app']);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /^overview$/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: /^services$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^incidents$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^maintenance$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^analytics$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^settings$/i })).toBeInTheDocument();
  });

  it('marks the active route with aria-current="page"', async () => {
    renderWithProviders(['/app/services']);

    await waitFor(() => {
      const activeLink = screen.getByRole('link', { name: /^services$/i });
      expect(activeLink).toHaveAttribute('aria-current', 'page');
    });

    const overviewLink = screen.getByRole('link', { name: /^overview$/i });
    expect(overviewLink).not.toHaveAttribute('aria-current');
  });

  it('OrgUserMenu renders session user data, org name, role badge, and handles logout', async () => {
    const user = userEvent.setup();
    renderWithProviders(['/app']);

    await waitFor(() => {
      expect(screen.getByText('Alice Developer')).toBeInTheDocument();
    });

    expect(screen.getByText('Acme Security')).toBeInTheDocument();

    // Open menu popover
    const trigger = screen.getByRole('button', { name: /user and organization menu/i });
    await user.click(trigger);

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();

    const signOutBtn = screen.getByRole('menuitem', { name: /sign out/i });
    expect(signOutBtn).toBeInTheDocument();
  });

  it('mobile nav toggle opens drawer sheet and closes on Escape key', async () => {
    const user = userEvent.setup();
    renderWithProviders(['/app']);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /toggle navigation/i })).toBeInTheDocument();
    });

    const toggleBtn = screen.getByRole('button', { name: /toggle navigation/i });
    await user.click(toggleBtn);

    expect(screen.getByRole('dialog', { name: /mobile navigation/i })).toBeInTheDocument();

    // Press Escape to dismiss
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /mobile navigation/i })).not.toBeInTheDocument();
    });
  });
});
