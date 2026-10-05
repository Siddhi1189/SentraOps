import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrgUserMenu } from '../OrgUserMenu';
import * as sessionModule from '../../../../app/providers/SessionProvider';

describe('OrgUserMenu', () => {
  beforeEach(() => {
    vi.spyOn(sessionModule, 'useSession').mockReturnValue({
      user: { id: 'u1', name: 'Alice Smith', email: 'alice@example.com', role: 'owner' } as any,
      organization: { id: 'o1', name: 'Acme Corp', slug: 'acme' } as any,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('renders user and organization name in menu', async () => {
    render(<OrgUserMenu />);

    // Open menu
    const trigger = screen.getByLabelText(/user and organization menu/i);
    await userEvent.click(trigger);

    expect(screen.getAllByText('Alice Smith').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Acme Corp').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('menuitem', { name: /sign out/i })).toBeInTheDocument();
  });
});

