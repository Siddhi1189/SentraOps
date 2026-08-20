import { useState } from 'react';
import type { HealthCheck } from '../../../types/domain';
import { useHealthCheckHistoryQuery } from '../hooks/useServices';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
} from '../../../components/ui/Table/Table';
import { Spinner } from '../../../components/ui/Spinner/Spinner';
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState';
import { EmptyState } from '../../../components/ui/EmptyState/EmptyState';

export interface HealthCheckHistoryTableProps {
  serviceId: string;
  enabled?: boolean;
}

export function HealthCheckHistoryTable({ serviceId, enabled = true }: HealthCheckHistoryTableProps) {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isError, error, refetch } = useHealthCheckHistoryQuery(
    serviceId,
    { page, limit },
    enabled
  );

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
        <Spinner size="md" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to Load Health Check History"
        message={error instanceof Error ? error.message : 'Network error'}
        onRetry={refetch}
      />
    );
  }

  const checks = data?.data || [];
  const total = data?.pagination?.total || 0;

  if (checks.length === 0) {
    return (
      <EmptyState
        title="No Health Checks Yet"
        description="Health check runs for this service will appear here once executed."
      />
    );
  }

  return (
    <div>
      <Table responsive>
        <TableHeader>
          <TableRow>
            <TableCell as="th">Timestamp</TableCell>
            <TableCell as="th">Result</TableCell>
            <TableCell as="th">Status Code</TableCell>
            <TableCell as="th">Response Time</TableCell>
            <TableCell as="th">Error / Note</TableCell>
          </TableRow>
        </TableHeader>

        <TableBody>
          {checks.map((check: HealthCheck) => (
            <TableRow key={check.id}>
              <TableCell dataLabel="Timestamp">
                {new Date(check.checkedAt).toLocaleString()}
              </TableCell>

              <TableCell dataLabel="Result">
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    backgroundColor: check.isHealthy
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(239, 68, 68, 0.15)',
                    color: check.isHealthy ? 'var(--color-success)' : 'var(--color-danger)',
                  }}
                >
                  {check.isHealthy ? 'HEALTHY' : 'UNHEALTHY'}
                </span>
              </TableCell>

              <TableCell dataLabel="Status Code">{check.statusCode ?? 'N/A'}</TableCell>

              <TableCell dataLabel="Response Time">
                {check.responseTimeMs !== null ? `${check.responseTimeMs} ms` : 'N/A'}
              </TableCell>

              <TableCell dataLabel="Error / Note">
                {check.errorMessage || <span style={{ color: 'var(--color-text-muted)' }}>None</span>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <TablePagination
        page={page}
        limit={limit}
        total={total}
        onPageChange={(newPage) => setPage(newPage)}
      />
    </div>
  );
}
