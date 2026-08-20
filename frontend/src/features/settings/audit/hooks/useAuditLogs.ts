import { useQuery } from '@tanstack/react-query';
import { auditKeys } from '../../../../lib/queryKeys';
import { listAuditLogs } from '../../../../api/audit';

export function useAuditLogsQuery(filters?: {
  page?: number;
  limit?: number;
  entityType?: string;
  userId?: string;
}) {
  return useQuery({
    queryKey: auditKeys.list(filters),
    queryFn: () => listAuditLogs(filters),
  });
}
