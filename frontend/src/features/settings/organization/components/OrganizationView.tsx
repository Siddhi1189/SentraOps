import { useState } from 'react';
import { PageHeader } from '../../../../components/ui/PageHeader/PageHeader';
import { Spinner } from '../../../../components/ui/Spinner/Spinner';
import { Button } from '../../../../components/ui/Button/Button';
import { ErrorState } from '../../../../components/ui/ErrorState/ErrorState';
import { useOrganizationQuery } from '../../team/hooks/useOrganizations';
import { useToast } from '../../../../app/providers/ToastProvider';
import { apiRequest } from '../../../../api/client';
import styles from './OrganizationView.module.css';

export function OrganizationView() {
  const { data: orgData, isLoading, isError, error, refetch } = useOrganizationQuery();
  const [isSeeding, setIsSeeding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const { showToast } = useToast();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !orgData?.data) {
    return (
      <ErrorState
        title="Failed to Load Organization"
        message={error instanceof Error ? error.message : 'Organization details could not be retrieved.'}
        onRetry={refetch}
      />
    );
  }

  // Handle both { organization: { name, slug } } and raw org object payloads
  const org = ('organization' in orgData.data ? orgData.data.organization : orgData.data) as {
    name: string;
    slug: string;
  };

  const handleLoadDemo = async () => {
    setIsSeeding(true);
    try {
      await apiRequest('/demo/seed', { method: 'POST' });
      showToast('Demo data loaded successfully!', 'success');
    } catch (err: any) {
      showToast(err?.error?.message || 'Failed to load demo data', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleRemoveDemo = async () => {
    setIsRemoving(true);
    try {
      await apiRequest('/demo/seed', { method: 'DELETE' });
      showToast('Demo data removed successfully!', 'success');
    } catch (err: any) {
      showToast(err?.error?.message || 'Failed to remove demo data', 'error');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Organization Profile"
        description="View your organization details and settings."
      />

      <div className={styles.card}>
        <h3 className={styles.title}>General Information</h3>
        <div className={styles.fieldGroup}>
          <div className={styles.field}>
            <span className={styles.label}>Organization Name</span>
            <span className={styles.value}>{org.name}</span>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Organization Slug</span>
            <span className={styles.codeValue}>{org.slug}</span>
          </div>
        </div>
      </div>

      <div className={styles.card} style={{ marginTop: 'var(--space-6)' }}>
        <h3 className={styles.title}>Demo Environment</h3>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          Populate realistic demo services, health checks, issues, and incidents for evaluation, or cleanly remove all demo records.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Button
            variant="secondary"
            onClick={handleLoadDemo}
            disabled={isSeeding || isRemoving}
          >
            {isSeeding ? 'Loading...' : 'Load demo data'}
          </Button>
          <Button
            variant="danger"
            onClick={handleRemoveDemo}
            disabled={isSeeding || isRemoving}
          >
            {isRemoving ? 'Removing...' : 'Remove demo data'}
          </Button>
        </div>
      </div>
    </div>
  );
}
