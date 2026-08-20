import { useState } from 'react';
import type React from 'react';
import { Modal } from '../../../components/ui/Modal/Modal';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import styles from './SubscribeButton.module.css';

export interface SubscribeButtonProps {
  companyName: string;
  orgSlug: string;
}

export function SubscribeButton({ companyName, orgSlug }: SubscribeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleOpen = () => {
    setIsOpen(true);
    setIsSubmitted(false);
    setEmail('');
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // TODO: wire to backend subscribe endpoint once available (e.g. POST /api/v1/status/:orgSlug/subscribe)
    console.info(`[Status Page] Subscription requested for ${email} on org: ${orgSlug}`);
    setIsSubmitted(true);
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
            <h3 className={styles.successTitle}>Subscription Request Received</h3>
            <p className={styles.successText}>
              Updates for <strong>{email}</strong> will be sent whenever incidents or maintenance are posted.
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

            <div className={styles.modalActions}>
              <Button type="button" variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={!email.trim()}>
                Subscribe
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
