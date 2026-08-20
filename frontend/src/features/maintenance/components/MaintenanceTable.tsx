import { Link } from 'react-router-dom';
import type { MaintenanceWindowDetail } from '../types/maintenance';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
} from '../../../components/ui/Table/Table';
import { MaintenanceStatusChip } from './MaintenanceStatusChip';
import { Button } from '../../../components/ui/Button/Button';
import { useSession } from '../../../app/providers/SessionProvider';
import { can } from '../../../permissions/can';
import styles from './MaintenanceTable.module.css';

export interface MaintenanceTableProps {
  windows: MaintenanceWindowDetail[];
  page: number;
  limit: number;
  total: number;
  onPageChange?: (newPage: number) => void;
  onEdit?: (window: MaintenanceWindowDetail) => void;
  onDelete?: (window: MaintenanceWindowDetail) => void;
  hidePagination?: boolean;
}

export function MaintenanceTable({
  windows,
  page,
  limit,
  total,
  onPageChange,
  onEdit,
  onDelete,
  hidePagination = false,
}: MaintenanceTableProps) {
  const { user } = useSession();
  const canManage = can(user, 'maintenance:manage');
  const showActions = canManage && (!!onEdit || !!onDelete);

  return (
    <>
      <Table responsive>
        <TableHeader>
          <TableRow>
            <TableCell as="th">Title</TableCell>
            <TableCell as="th">Scope</TableCell>
            <TableCell as="th">Status</TableCell>
            <TableCell as="th" className={styles.desktopOnly}>
              Start Time
            </TableCell>
            <TableCell as="th" className={styles.desktopOnly}>
              End Time
            </TableCell>
            {showActions && <TableCell as="th">Actions</TableCell>}
          </TableRow>
        </TableHeader>

        <TableBody>
          {windows.map((win) => {
            const scopeLabel = win.service?.name || (win.serviceId ? 'Service' : 'Organization-wide');

            return (
              <TableRow key={win.id}>
                <TableCell dataLabel="Title">
                  <Link to={`/app/maintenance/${win.id}`} className={styles.itemLink}>
                    {win.title}
                  </Link>
                </TableCell>

                <TableCell dataLabel="Scope">{scopeLabel}</TableCell>

                <TableCell dataLabel="Status">
                  <MaintenanceStatusChip status={win.status} />
                </TableCell>

                <TableCell dataLabel="Start Time" className={styles.desktopOnly}>
                  {new Date(win.startTime).toLocaleString()}
                </TableCell>

                <TableCell dataLabel="End Time" className={styles.desktopOnly}>
                  {new Date(win.endTime).toLocaleString()}
                </TableCell>

                {showActions && (
                  <TableCell dataLabel="Actions">
                    <div className={styles.actionsCell}>
                      {onEdit && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => onEdit(win)}
                        >
                          Edit
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          type="button"
                          variant="danger"
                          onClick={() => onDelete(win)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {!hidePagination && onPageChange && (
        <TablePagination page={page} limit={limit} total={total} onPageChange={onPageChange} />
      )}
    </>
  );
}
