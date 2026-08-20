import { PageHeader } from '../../../../components/ui/PageHeader/PageHeader';
import { Spinner } from '../../../../components/ui/Spinner/Spinner';
import { ErrorState } from '../../../../components/ui/ErrorState/ErrorState';
import { useOrganizationQuery } from '../../team/hooks/useOrganizations';
import styles from './OrganizationView.module.css';

export function OrganizationView() {
  const { data: orgData, isLoading, isError, error, refetch } = useOrganizationQuery();

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
    </div>
  );
}
