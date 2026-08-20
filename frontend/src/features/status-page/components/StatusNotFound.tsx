export function StatusNotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg-subtle, #f8fafc)',
        color: 'var(--color-text, #0f172a)',
        padding: '24px',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-bg-surface, #ffffff)',
          border: '1px solid var(--color-border, #e2e8f0)',
          borderRadius: '12px',
          padding: '40px 32px',
          maxWidth: '480px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        }}
      >
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            marginBottom: '12px',
            color: 'var(--color-text, #0f172a)',
          }}
        >
          Status Page Not Found
        </h1>
        <p
          style={{
            fontSize: '0.9375rem',
            color: 'var(--color-text-muted, #64748b)',
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          The requested organization status page does not exist or has been removed. Please check the URL and try again.
        </p>
      </div>
    </div>
  );
}
