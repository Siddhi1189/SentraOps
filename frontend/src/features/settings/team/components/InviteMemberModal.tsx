import { useState } from 'react';
import { Modal } from '../../../../components/ui/Modal/Modal';
import { Input } from '../../../../components/ui/Input/Input';
import { Select } from '../../../../components/ui/Select/Select';
import { Button } from '../../../../components/ui/Button/Button';

export interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (data: { email: string; role: 'admin' | 'viewer' }) => Promise<void>;
  isSubmitting?: boolean;
}

export function InviteMemberModal({
  isOpen,
  onClose,
  onInvite,
  isSubmitting = false,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'viewer'>('viewer');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setError(null);
    try {
      await onInvite({ email, role });
      setEmail('');
      setRole('viewer');
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  const handleClose = () => {
    setEmail('');
    setRole('viewer');
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite Team Member">
      <form
        id="invite-member-form"
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        {error && (
          <div
            role="alert"
            style={{
              color: 'var(--color-danger, #ef4444)',
              fontSize: '0.875rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              padding: '8px 12px',
              borderRadius: '4px',
            }}
          >
            {error}
          </div>
        )}

        <Input
          label="Email Address"
          id="invite-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="colleague@example.com"
          required
          autoFocus
        />

        <Select
          label="Role"
          id="invite-role"
          value={role}
          onChange={(e) => setRole(e.target.value as 'admin' | 'viewer')}
          options={[
            { label: 'Admin (Can manage services, incidents, maintenance)', value: 'admin' },
            { label: 'Viewer (Read-only access)', value: 'viewer' },
          ]}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Invitation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
