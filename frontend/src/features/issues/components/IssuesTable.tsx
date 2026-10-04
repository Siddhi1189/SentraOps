import { Link } from 'react-router-dom';
import type { Issue, IssueStatus, IssueLevel } from '../types/issues';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
} from '../../../components/ui/Table/Table';
import { StatusChip, type StatusVariant } from '../../../components/ui/StatusChip/StatusChip';
import styles from './IssuesTable.module.css';

export interface IssuesTableProps {
  issues: Issue[];
  page: number;
  limit: number;
  total: number;
  onPageChange?: (newPage: number) => void;
  hidePagination?: boolean;
}

const statusMap: Record<IssueStatus, StatusVariant> = {
  unresolved: 'open',
  resolved: 'resolved',
  ignored: 'maintenance',
};

const levelMap: Record<IssueLevel, StatusVariant> = {
  error: 'danger',
  warning: 'warning',
  info: 'info',
};

function formatRelativeTime(dateString: string): string {
  try {
    const then = new Date(dateString).getTime();
    const now = Date.now();
    const diffSec = Math.floor((now - then) / 1000);

    if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString;
  }
}

export function IssuesTable({
  issues,
  page,
  limit,
  total,
  onPageChange,
  hidePagination = false,
}: IssuesTableProps) {
  return (
    <>
      <Table responsive>
        <TableHeader>
          <TableRow>
            <TableCell as="th">Issue</TableCell>
            <TableCell as="th">Level</TableCell>
            <TableCell as="th">Status</TableCell>
            <TableCell as="th" className={styles.desktopOnly}>Environment</TableCell>
            <TableCell as="th" className={styles.desktopOnly}>Events</TableCell>
            <TableCell as="th" className={styles.desktopOnly}>Users</TableCell>
            <TableCell as="th" className={styles.desktopOnly}>Last Seen</TableCell>
            <TableCell as="th" className={styles.desktopOnly}>Assignee</TableCell>
          </TableRow>
        </TableHeader>

        <TableBody>
          {issues.map((issue) => {
            const statusVariant = statusMap[issue.status] || 'unknown';
            const levelVariant = levelMap[issue.level] || 'info';

            return (
              <TableRow key={issue.id}>
                <TableCell dataLabel="Issue">
                  <div className={styles.titleCell}>
                    <Link to={`/app/issues/${issue.id}`} className={styles.titleLink}>
                      {issue.title}
                    </Link>
                    <div className={styles.subInfo}>
                      <span>{issue.project?.name || 'Project'}</span>
                      {issue.isRegression && (
                        <span className={styles.regressionBadge}>
                          {issue.regressedInRelease ? `Regression in ${issue.regressedInRelease}` : 'Regression'}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>

                <TableCell dataLabel="Level">
                  <StatusChip status={levelVariant} label={issue.level} />
                </TableCell>

                <TableCell dataLabel="Status">
                  <StatusChip status={statusVariant} label={issue.status} />
                </TableCell>

                <TableCell dataLabel="Environment" className={styles.desktopOnly}>
                  {issue.environment}
                </TableCell>

                <TableCell dataLabel="Events" className={styles.desktopOnly}>
                  <strong>{issue.eventCount.toLocaleString()}</strong>
                </TableCell>

                <TableCell dataLabel="Users" className={styles.desktopOnly}>
                  {issue.userCount.toLocaleString()}
                </TableCell>

                <TableCell dataLabel="Last Seen" className={styles.desktopOnly} title={new Date(issue.lastSeenAt).toLocaleString()}>
                  {formatRelativeTime(issue.lastSeenAt)}
                </TableCell>

                <TableCell dataLabel="Assignee" className={styles.desktopOnly}>
                  {issue.assignedUser?.name || 'Unassigned'}
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

export default IssuesTable;
