import { useState } from 'react';
import type React from 'react';
import { Modal } from '../../../components/ui/Modal/Modal';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { apiClient } from '../../../api/client';
import styles from './SubscribeButton.module.css';

export interface SubscribeButtonProps {
  companyName: string;
  orgSlug: string;
}

export function SubscribeButton({ companyName, orgSlug }: SubscribeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = () => {
    setIsOpen(true);
    setIsSubmitted(false);
    setEmail('');
    setError(null);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);

    try {
      await apiClient.post(`/status/${orgSlug}/subscribe`, { email });
      setIsSubmitted(true);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Failed to subscribe. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={styles.subscribeBtn}
        onClick={handleOpen}
        aria-label={`Subscribe to ${companyName} status updates`}
      >
        <svg
          className={styles.bellIcon}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span>Subscribe to Updates</span>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={`Subscribe to ${companyName} Updates`}
      >
        {isSubmitted ? (
          <div className={styles.successState}>
            <div className={styles.successIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className={styles.successTitle}>Check Your Inbox</h3>
            <p className={styles.successText}>
              A confirmation email has been sent to <strong>{email}</strong>. Click the link in the email to confirm your subscription.
            </p>
            <Button variant="secondary" onClick={handleClose} className={styles.closeActionBtn}>
              Done
            </Button>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <p className={styles.formDescription}>
              Get real-time notifications sent directly to your inbox whenever {companyName} creates, updates, or resolves an incident or maintenance window.
            </p>

            <Input
              label="Email Address"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoFocus
            />

            {error && (
              <p role="alert" style={{ color: 'var(--color-error, #ef4444)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                {error}
              </p>
            )}

            <div className={styles.modalActions}>
              <Button type="button" variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={!email.trim() || isLoading}>
                {isLoading ? 'Subscribing…' : 'Subscribe'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
