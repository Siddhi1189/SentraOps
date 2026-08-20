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
import { Button } from '../../../components/ui/Button/Button';
import styles from './ServicesTable.module.css';

export interface ServicesTableProps {
  services: Service[];
  page: number;
  limit: number;
  total: number;
  onPageChange: (newPage: number) => void;
  onEditService?: (service: Service) => void;
  onDeleteService?: (service: Service) => void;
}

export function ServicesTable({
  services,
  page,
  limit,
  total,
  onPageChange,
  onEditService,
  onDeleteService,
}: ServicesTableProps) {
  const { user } = useSession();
  const canUpdate = can(user, 'service:update');
  const canDelete = can(user, 'service:delete');
  const showActions = canUpdate || canDelete;

  return (
    <>
      <Table responsive>
        <TableHeader>
          <TableRow>
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
                <StatusChip status={service.currentStatus} />
              </TableCell>

              <TableCell dataLabel="Environment">
                <span style={{ textTransform: 'capitalize' }}>{service.environment}</span>
              </TableCell>

              <TableCell dataLabel="Priority">
                <span className={styles.priorityBadge}>{service.priority}</span>
              </TableCell>

              <TableCell dataLabel="Target URL">
                <span className={styles.urlText}>{service.url}</span>
              </TableCell>

              <TableCell dataLabel="Check Interval">{service.checkIntervalSeconds}s</TableCell>

              {showActions && (
                <TableCell dataLabel="Actions">
                  <div className={styles.actions}>
                    {canUpdate && onEditService && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => onEditService(service)}
                        aria-label={`Edit ${service.name}`}
                      >
                        Edit
                      </Button>
                    )}
                    {canDelete && onDeleteService && (
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => onDeleteService(service)}
                        aria-label={`Delete ${service.name}`}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
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
