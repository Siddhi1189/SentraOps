import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRequest } from '../api/client';

export function StatusUnsubscribePage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid unsubscribe link.');
      return;
    }

    apiRequest<{ message?: string }>(`/status/unsubscribe/${token}`, { isPublic: true })
      .then((res) => {
        setMessage(res.data?.message || 'You have been unsubscribed.');
        setStatus('success');
      })
      .catch((err: { error?: { message?: string } }) => {
        setMessage(err?.error?.message || 'Invalid or expired unsubscribe link.');
        setStatus('error');
      });
  }, [token]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-family-sans)',
        background: 'var(--surface-cream)',
        color: 'var(--color-text-primary)',
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      {status === 'loading' && <p>Processing your request…</p>}
      {status === 'success' && (
        <>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Unsubscribed</h1>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '420px' }}>{message}</p>
          <Link to="/" style={{ marginTop: '1rem', color: 'var(--color-text-primary)', textDecoration: 'underline' }}>
            Return to home
          </Link>
        </>
      )}
      {status === 'error' && (
        <>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Error</h1>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '420px' }}>{message}</p>
          <Link to="/" style={{ marginTop: '1rem', color: 'var(--color-text-primary)', textDecoration: 'underline' }}>
            Return to home
          </Link>
        </>
      )}
    </div>
  );
}
