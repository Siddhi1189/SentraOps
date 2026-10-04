import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrgUserMenu } from '../OrgUserMenu';
import * as sessionModule from '../../../../app/providers/SessionProvider';

describe('OrgUserMenu theme toggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.spyOn(sessionModule, 'useSession').mockReturnValue({
      user: { id: 'u1', name: 'Alice Smith', email: 'alice@example.com', role: 'owner' } as any,
      organization: { id: 'o1', name: 'Acme Corp', slug: 'acme' } as any,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('toggles theme between light and dark and persists to localStorage', async () => {
    render(<OrgUserMenu />);

    // Open menu
    const trigger = screen.getByLabelText(/user and organization menu/i);
    await userEvent.click(trigger);

    // Find theme toggle button
    const toggleBtn = screen.getByRole('button', { name: /toggle dark mode/i });
    expect(toggleBtn).toBeInTheDocument();

    // Default starts at light, click toggles to dark
    await userEvent.click(toggleBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('sentraops_theme')).toBe('dark');

    // Click again toggles to light
    await userEvent.click(toggleBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('sentraops_theme')).toBe('light');
  });
});
