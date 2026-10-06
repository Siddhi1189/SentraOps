import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchStatusPageSettings, updateStatusPageSettings } from '../api/statusPageSettings';
import { statusPageSettingsKeys } from '../lib/queryKeys';
import { useSession } from '../app/providers/SessionProvider';
import { useToast } from '../app/providers/ToastProvider';
import { can } from '../permissions/can';
import { Input } from '../components/ui/Input/Input';
import { Select } from '../components/ui/Select/Select';
import { Button } from '../components/ui/Button/Button';
import { Skeleton } from '../components/ui/Skeleton/Skeleton';
import { ErrorState } from '../components/ui/ErrorState/ErrorState';
import styles from './StatusPageSettingsPage.module.css';

export function StatusPageSettingsPage() {
  const { user, organization } = useSession();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const canEdit = can(user, 'statusPage:manage');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: statusPageSettingsKeys.settings(),
    queryFn: fetchStatusPageSettings,
  });

  const [subdomain, setSubdomain] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [theme, setTheme] = useState('light');

  const settings = data?.data?.settings;

  useEffect(() => {
    if (settings) {
      setSubdomain(settings.subdomain || organization?.slug || '');
      setCustomDomain(settings.customDomain || '');
      setLogoUrl(settings.logoUrl || '');
      setTheme(settings.theme || 'light');
    } else if (organization?.slug) {
      setSubdomain(organization.slug);
    }
  }, [settings, organization?.slug]);

  const updateMutation = useMutation({
    mutationFn: updateStatusPageSettings,
    onSuccess: (res) => {
      queryClient.setQueryData(statusPageSettingsKeys.settings(), res);
      showToast('Status page settings saved', 'success');
    },
    onError: (err: Error) => {
      showToast(err.message || 'Failed to update settings', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    updateMutation.mutate({
      subdomain: subdomain.trim(),
      customDomain: customDomain.trim() ? customDomain.trim() : null,
      logoUrl: logoUrl.trim() ? logoUrl.trim() : null,
      theme,
    });
  };

  const orgSlug = organization?.slug || subdomain || 'default';

  if (isLoading) {
    return (
      <div className={styles.container}>
        <Skeleton height={32} width={240} />
        <Skeleton height={20} width={400} />
        <div className={styles.formSkeleton}>
          <Skeleton height={42} />
          <Skeleton height={42} />
          <Skeleton height={42} />
          <Skeleton height={42} />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.container}>
        <ErrorState
          title="Could not load status page settings"
          message={(error as Error)?.message || 'An unexpected error occurred.'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.title}>Status Page Settings</h2>
          <p className={styles.subtitle}>
            Configure your organization&apos;s public status page branding, domain, and appearance.
          </p>
        </div>
        <a
          href={`/status/${orgSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.publicLink}
        >
          View Public Status Page
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>

      {!canEdit && (
        <div className={styles.noticeBanner}>
          You are viewing these settings in read-only mode. Owner or Admin privileges are required to make changes.
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.formCard}>
        <div className={styles.fieldGroup}>
          <Input
            label="Subdomain / Slug"
            id="subdomain"
            value={subdomain}
            onChange={(e) => setSubdomain(e.target.value)}
            disabled={!canEdit || updateMutation.isPending}
            placeholder="my-company"
            required
          />
          <span className={styles.hintText}>
            Public URL path: <code>/status/{subdomain || '&lt;slug&gt;'}</code>
          </span>
        </div>

        <div className={styles.fieldGroup}>
          <Input
            label="Custom Domain (optional)"
            id="customDomain"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            disabled={!canEdit || updateMutation.isPending}
            placeholder="status.example.com"
          />
          <span className={styles.hintText}>
            Configure a CNAME record to point your custom domain here.
          </span>
        </div>

        <div className={styles.fieldGroup}>
          <Input
            label="Logo URL (optional)"
            id="logoUrl"
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            disabled={!canEdit || updateMutation.isPending}
            placeholder="https://example.com/logo.png"
          />
        </div>

        <div className={styles.fieldGroup}>
          <Select
            label="Theme"
            id="theme"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            disabled={!canEdit || updateMutation.isPending}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
        </div>

        {canEdit && (
          <div className={styles.actionRow}>
            <Button
              type="submit"
              variant="primary"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}

export default StatusPageSettingsPage;
