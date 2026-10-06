import { Link } from 'react-router-dom';
import type { Service } from '../../../types/domain';
import { useSession } from '../../../app/providers/SessionProvider';
import { can } from '../../../permissions/can';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
} from '../../../components/ui/Table/Table';
import { StatusChip } from '../../../components/ui/StatusChip/StatusChip';
import { TableActionsMenu } from '../../../components/ui/TableActionsMenu/TableActionsMenu';
import { ServiceSparkline } from './ServiceSparkline';
import styles from './ServicesTable.module.css';

export interface ServicesTableProps {
  services: Service[];
  page: number;
  limit: number;
  total: number;
  onPageChange: (newPage: number) => void;
  onEditService?: (service: Service) => void;
  onDeleteService?: (service: Service) => void;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
  onPauseService?: (service: Service) => void;
  onResumeService?: (service: Service) => void;
  onCheckNow?: (service: Service) => void;
  isCheckingNowId?: string | null;
}

export function ServicesTable({
  services,
  page,
  limit,
  total,
  onPageChange,
  onEditService,
  onDeleteService,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onPauseService,
  onResumeService,
  onCheckNow,
  isCheckingNowId,
}: ServicesTableProps) {
  const { user } = useSession();
  const canUpdate = can(user, 'service:update');
  const canDelete = can(user, 'service:delete');
  const showActions = canUpdate || canDelete;
  const showSelect = selectedIds !== undefined;

  return (
    <>
      <Table responsive>
        <TableHeader>
          <TableRow>
            {showSelect && (
              <TableCell as="th" style={{ width: '40px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  aria-label="Select all services"
                  checked={services.length > 0 && selectedIds.length === services.length}
                  onChange={onToggleSelectAll}
                />
              </TableCell>
            )}
            <TableCell as="th">Service Name</TableCell>
            <TableCell as="th">Status</TableCell>
            <TableCell as="th">Environment</TableCell>
            <TableCell as="th">Priority</TableCell>
            <TableCell as="th">Target URL</TableCell>
            <TableCell as="th">Check Interval</TableCell>
            {showActions && <TableCell as="th">Actions</TableCell>}
          </TableRow>
        </TableHeader>

        <TableBody>
          {services.map((service) => (
            <TableRow key={service.id}>
              {showSelect && (
                <TableCell dataLabel="Select" style={{ width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    aria-label={`Select ${service.name}`}
                    checked={selectedIds.includes(service.id)}
                    onChange={() => onToggleSelect?.(service.id)}
                  />
                </TableCell>
              )}

              <TableCell dataLabel="Service Name">
                <div>
                  <Link to={`/app/services/${service.id}`} className={styles.serviceLink}>
                    {service.name}
                  </Link>
                  {service.tags && service.tags.length > 0 && (
                    <div style={{ marginTop: '4px' }}>
                      {service.tags.map((tag) => (
                        <span key={tag} className={styles.tagChip}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </TableCell>

              <TableCell dataLabel="Status">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        flexShrink: 0,
                        backgroundColor: !service.isActive
                          ? 'var(--color-neutral-400, #94a3b8)'
                          : service.currentStatus === 'up'
                          ? 'var(--color-success, #10b981)'
                          : service.currentStatus === 'degraded'
                          ? 'var(--color-warning, #f59e0b)'
                          : service.currentStatus === 'down'
                          ? 'var(--color-danger, #ef4444)'
                          : 'var(--color-neutral-400, #94a3b8)',
                        display: 'inline-block',
                      }}
                      aria-hidden="true"
                    />
                    {!service.isActive ? (
                      <StatusChip status="paused" label="Paused" />
                    ) : (
                      <StatusChip status={service.currentStatus} />
                    )}
                  </div>
                  {service.sparkline && service.sparkline.length > 0 && (
                    <ServiceSparkline
                      points={service.sparkline}
                      status={service.currentStatus}
                    />
                  )}
                </div>
              </TableCell>

              <TableCell dataLabel="Environment">
                <span style={{ textTransform: 'capitalize' }}>{service.environment}</span>
              </TableCell>

              <TableCell dataLabel="Priority">
                <span className={styles.priorityBadge}>{service.priority}</span>
              </TableCell>

              <TableCell dataLabel="Target URL">
                <span className={styles.urlText}>{service.url || '—'}</span>
              </TableCell>

              <TableCell dataLabel="Check Interval">{service.checkIntervalSeconds}s</TableCell>

              {showActions && (
                <TableCell dataLabel="Actions">
                  <TableActionsMenu
                    label={`Actions for ${service.name}`}
                    items={[
                      ...(canUpdate && onCheckNow
                        ? [
                            {
                              label: isCheckingNowId === service.id ? 'Checking...' : 'Check Now',
                              onClick: () => onCheckNow(service),
                              disabled: isCheckingNowId === service.id,
                            },
                          ]
                        : []),
                      ...(canUpdate && onPauseService && service.isActive
                        ? [
                            {
                              label: 'Pause Monitoring',
                              onClick: () => onPauseService(service),
                            },
                          ]
                        : []),
                      ...(canUpdate && onResumeService && !service.isActive
                        ? [
                            {
                              label: 'Resume Monitoring',
                              onClick: () => onResumeService(service),
                            },
                          ]
                        : []),
                      ...(canUpdate && onEditService
                        ? [
                            {
                              label: 'Edit',
                              onClick: () => onEditService(service),
                            },
                          ]
                        : []),
                      ...(canDelete && onDeleteService
                        ? [
                            {
                              label: 'Delete',
                              variant: 'danger' as const,
                              onClick: () => onDeleteService(service),
                            },
                          ]
                        : []),
                    ]}
                  />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <TablePagination page={page} limit={limit} total={total} onPageChange={onPageChange} />
    </>
  );
}
