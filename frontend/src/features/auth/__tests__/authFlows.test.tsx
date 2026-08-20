import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/msw/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '../../../app/providers/QueryClientProvider';
import { SessionProvider, useSession } from '../../../app/providers/SessionProvider';
import { ToastProvider } from '../../../app/providers/ToastProvider';
import { PublicOnlyRoute } from '../../../app/router/PublicOnlyRoute';
import { ProtectedRoute } from '../../../app/router/ProtectedRoute';
import { LoginPage } from '../../../pages/LoginPage';
import { RegisterPage } from '../../../pages/RegisterPage';
import { ForgotPasswordPage } from '../../../pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../../../pages/ResetPasswordPage';
import { AcceptInvitePage } from '../../../pages/AcceptInvitePage';
import { OverviewPage } from '../../../pages/OverviewPage';
import { getAccessToken, setAccessToken } from '../../../lib/authTokenStore';

function TestSessionConsumer() {
  const { user, organization, isAuthenticated, isLoading, logout } = useSession();
  return (
    <div>
      <div data-testid="loading-state">{isLoading ? 'loading' : 'idle'}</div>
      <div data-testid="auth-state">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</div>
      <div data-testid="user-name">{user?.name || 'none'}</div>
      <div data-testid="org-name">{organization?.name || 'none'}</div>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

function renderWithProviders(initialEntries = ['/login']) {
  return render(
    <QueryClientProvider>
      <SessionProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={initialEntries}>
            <Routes>
              <Route element={<PublicOnlyRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/accept-invite" element={<AcceptInvitePage />} />
              </Route>
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<OverviewPage />} />
                <Route path="/app" element={<OverviewPage />} />
              </Route>
              <Route path="/test-session" element={<TestSessionConsumer />} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}

describe('Authentication Flows & Session Hydration', () => {
  beforeEach(() => {
    setAccessToken(null);
    // By default, unauthenticated visitor for public form tests
    server.use(
      http.post('/api/v1/auth/refresh', () => {
        return HttpResponse.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: 'No refresh cookie' } },
          { status: 401 }
        );
      })
    );
  });

  describe('Session Boot Hydration', () => {
    it('hydrates session successfully when refresh and /auth/me succeed', async () => {
      server.use(
        http.post('/api/v1/auth/refresh', () => {
          return HttpResponse.json({
            success: true,
            data: { accessToken: 'mock-refreshed-token' },
          });
        })
      );

      renderWithProviders(['/test-session']);

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('idle');
      });

      expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-name')).not.toHaveTextContent('none');
      expect(getAccessToken()).toBe('mock-refreshed-token');
    });

    it('clears session when boot refresh fails', async () => {
      renderWithProviders(['/test-session']);

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toHaveTextContent('idle');
      });

      expect(screen.getByTestId('auth-state')).toHaveTextContent('unauthenticated');
      expect(screen.getByTestId('user-name')).toHaveTextContent('none');
      expect(getAccessToken()).toBeNull();
    });

    it('redirects authenticated user away from public auth route to /', async () => {
      server.use(
        http.post('/api/v1/auth/refresh', () => {
          return HttpResponse.json({
            success: true,
            data: { accessToken: 'mock-refreshed-token' },
          });
        })
      );

      renderWithProviders(['/login']);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1, name: /^overview$/i })).toBeInTheDocument();
      });
    });
  });

  describe('Registration Flow', () => {
    it('allows a user to register and redirects to protected root', async () => {
      const user = userEvent.setup();
      renderWithProviders(['/register']);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/organization name/i), 'Acme Inc');
      await user.type(screen.getByLabelText(/your full name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john@acme.com');
      await user.type(screen.getByLabelText(/^password/i), 'Password123!');
      await user.click(screen.getByRole('button', { name: /get started/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1, name: /^overview$/i })).toBeInTheDocument();
      });

      expect(getAccessToken()).toBe('mock-register-token');
    });
  });

  describe('Login & Logout Flow', () => {
    it('allows a user to log in with valid credentials', async () => {
      const user = userEvent.setup();
      renderWithProviders(['/login']);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /sign in to sentraops/i })).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/email address/i), 'john@acme.com');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1, name: /^overview$/i })).toBeInTheDocument();
      });

      expect(getAccessToken()).toBe('mock-login-token');
    });

    it('displays inline banner on invalid credentials', async () => {
      const user = userEvent.setup();
      renderWithProviders(['/login']);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /sign in to sentraops/i })).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/email address/i), 'invalid@sentraops.com');
      await user.type(screen.getByLabelText(/^password$/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/invalid email or password/i);
      });
    });

    it('clears session deterministically on logout even if network request fails', async () => {
      server.use(
        http.post('/api/v1/auth/refresh', () => {
          return HttpResponse.json({
            success: true,
            data: { accessToken: 'mock-refreshed-token' },
          });
        }),
        http.post('/api/v1/auth/logout', () => {
          return HttpResponse.json(
            { success: false, error: { code: 'NETWORK_ERROR', message: 'Failed to connect' } },
            { status: 500 }
          );
        })
      );

      const user = userEvent.setup();
      renderWithProviders(['/test-session']);

      await waitFor(() => {
        expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated');
      });

      await user.click(screen.getByRole('button', { name: /logout/i }));

      await waitFor(() => {
        expect(screen.getByTestId('auth-state')).toHaveTextContent('unauthenticated');
      });

      expect(getAccessToken()).toBeNull();
    });
  });

  describe('Password Recovery & Reset', () => {
    it('handles forgot password submission', async () => {
      const user = userEvent.setup();
      renderWithProviders(['/forgot-password']);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/email address/i), 'john@acme.com');
      await user.click(screen.getByRole('button', { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(/password reset email sent/i);
      });
    });

    it('handles reset password with token', async () => {
      const user = userEvent.setup();
      renderWithProviders(['/reset-password?token=valid-reset-token']);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /set new password/i })).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/^new password/i), 'NewPassword123!');
      await user.click(screen.getByRole('button', { name: /reset password/i }));

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(/password has been reset/i);
      });
    });
  });

  describe('Accept Invitation', () => {
    it('handles accept invite flow with valid token', async () => {
      const user = userEvent.setup();
      renderWithProviders(['/accept-invite?token=valid-invite-token']);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /accept invitation/i })).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/your full name/i), 'Invited User');
      await user.type(screen.getByLabelText(/^password/i), 'NewPassword123!');
      await user.click(screen.getByRole('button', { name: /accept & sign in/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1, name: /^overview$/i })).toBeInTheDocument();
      });

      expect(getAccessToken()).toBe('mock-invite-token');
    });
  });
});
