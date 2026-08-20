import { useState } from 'react';
import { PageHeader } from '../../../../components/ui/PageHeader/PageHeader';
import { Spinner } from '../../../../components/ui/Spinner/Spinner';
import { ErrorState } from '../../../../components/ui/ErrorState/ErrorState';
import { AuditLogTable } from './AuditLogTable';
import { AuditLogFilters } from './AuditLogFilters';
import { useAuditLogsQuery } from '../hooks/useAuditLogs';
import styles from './AuditLogView.module.css';

export function AuditLogView() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const [entityType, setEntityType] = useState('');
  const [userId, setUserId] = useState('');

  const filters = {
    page,
    limit,
    ...(entityType ? { entityType } : {}),
    ...(userId ? { userId } : {}),
  };

  const { data: auditRes, isLoading, isError, error, refetch } = useAuditLogsQuery(filters);

  const logs = auditRes?.data || [];
  const total = auditRes?.pagination?.total ?? logs.length;

  const handleEntityTypeChange = (val: string) => {
    setEntityType(val);
    setPage(1);
  };

  const handleUserIdChange = (val: string) => {
    setUserId(val);
    setPage(1);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to Load Audit Logs"
        message={error instanceof Error ? error.message : 'Audit log entries could not be retrieved.'}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Audit Log"
        description="Inspect administrative activity and mutating system actions."
      />

      <AuditLogFilters
        entityType={entityType}
        onEntityTypeChange={handleEntityTypeChange}
        userId={userId}
        onUserIdChange={handleUserIdChange}
      />

      <AuditLogTable
        logs={logs}
        page={page}
        limit={limit}
        total={total}
        onPageChange={setPage}
      />
    </div>
  );
}
