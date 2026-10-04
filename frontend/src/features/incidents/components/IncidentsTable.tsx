import { Link } from 'react-router-dom';
import type { IncidentDetail } from '../types/incidents';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
} from '../../../components/ui/Table/Table';
import { StatusChip, type StatusVariant } from '../../../components/ui/StatusChip/StatusChip';
import { Button } from '../../../components/ui/Button/Button';
import { useAcknowledgeIncidentMutation } from '../hooks/useIncidents';
import styles from './IncidentsTable.module.css';

export interface IncidentsTableProps {
  incidents: IncidentDetail[];
  page: number;
  limit: number;
  total: number;
  onPageChange?: (newPage: number) => void;
  hidePagination?: boolean;
}

const statusChipMap: Record<IncidentDetail['status'], StatusVariant> = {
  open: 'open',
  investigating: 'investigating',
  identified: 'warning',
  monitoring: 'info',
  resolved: 'resolved',
};

export function IncidentsTable({
  incidents,
  page,
  limit,
  total,
  onPageChange,
  hidePagination = false,
}: IncidentsTableProps) {
  const acknowledgeMutation = useAcknowledgeIncidentMutation();

  return (
    <>
      <Table responsive>
        <TableHeader>
          <TableRow>
            <TableCell as="th">Title</TableCell>
            <TableCell as="th">Status</TableCell>
            <TableCell as="th">Severity</TableCell>
            <TableCell as="th" className={styles.desktopOnly}>
              Service
            </TableCell>
            <TableCell as="th" className={styles.desktopOnly}>
              Assignee
            </TableCell>
            <TableCell as="th" className={styles.desktopOnly}>
              Detected At
            </TableCell>
            <TableCell as="th">Actions</TableCell>
          </TableRow>
        </TableHeader>

        <TableBody>
          {incidents.map((incident) => {
            const severityClass = styles[`severity_${incident.severity}`] || '';
            const chipVariant = statusChipMap[incident.status] || 'unknown';

            return (
              <TableRow key={incident.id}>
                <TableCell dataLabel="Title">
                  <Link to={`/app/incidents/${incident.id}`} className={styles.incidentLink}>
                    {incident.title}
                  </Link>
                </TableCell>

                <TableCell dataLabel="Status">
                  <StatusChip status={chipVariant} label={incident.status} />
                </TableCell>

                <TableCell dataLabel="Severity">
                  <span className={`${styles.severityBadge} ${severityClass}`}>
                    {incident.severity}
                  </span>
                </TableCell>

                <TableCell dataLabel="Service" className={styles.desktopOnly}>
                  {incident.service?.name || incident.serviceId}
                </TableCell>

                <TableCell dataLabel="Assignee" className={styles.desktopOnly}>
                  {incident.assignedUser?.name ||
                    (incident.assignedUserId ? 'Assigned' : 'Unassigned')}
                </TableCell>

                <TableCell dataLabel="Detected At" className={styles.desktopOnly}>
                  {new Date(incident.detectedAt).toLocaleString()}
                </TableCell>

                <TableCell dataLabel="Actions">
                  {incident.acknowledgedAt ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        color: 'var(--color-teal-600, #0d9488)',
                        fontFamily: 'var(--font-mono)',
                        backgroundColor: 'rgba(13, 148, 136, 0.1)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-xs)',
                        fontWeight: 600,
                      }}
                      title={`Acknowledged at ${new Date(incident.acknowledgedAt).toLocaleString()}`}
                    >
                      ✓ Ack'd
                    </span>
                  ) : incident.status !== 'resolved' ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        acknowledgeMutation.mutate({
                          id: incident.id,
                          updatedAt: incident.updatedAt,
                        })
                      }
                      disabled={acknowledgeMutation.isPending}
                    >
                      Acknowledge
                    </Button>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>—</span>
                  )}
                </TableCell>
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
