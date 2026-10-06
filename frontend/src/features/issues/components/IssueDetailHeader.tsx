import { Link } from 'react-router-dom';
import type { Issue } from '../types/issues';
import { Button } from '../../../components/ui/Button/Button';
import { StatusChip } from '../../../components/ui/StatusChip/StatusChip';
import styles from './IssueDetailHeader.module.css';

export interface IssueDetailHeaderProps {
  issue: Issue;
  canUpdate: boolean;
  canCreateIncident: boolean;
  onResolve: () => void;
  onIgnore: () => void;
  onReopen: () => void;
  onCreateIncidentClick: () => void;
  isUpdating?: boolean;
  conflictError?: string | null;
  onReload?: () => void;
}

export function IssueDetailHeader({
  issue,
  canUpdate,
  canCreateIncident,
  onResolve,
  onIgnore,
  onReopen,
  onCreateIncidentClick,
  isUpdating = false,
  conflictError = null,
  onReload,
}: IssueDetailHeaderProps) {
  const isResolved = issue.status === 'resolved';
  const isIgnored = issue.status === 'ignored';

  return (
    <div className={styles.headerContainer}>
      {conflictError && (
        <div className={styles.conflictAlert}>
          <span>{conflictError}</span>
          {onReload && (
            <Button size="sm" variant="secondary" onClick={onReload}>
              Reload latest
            </Button>
          )}
        </div>
      )}

      <div className={styles.topRow}>
        <div className={styles.titleArea}>
          <div className={styles.metaRow}>
            <span>{issue.project?.name || 'Project'}</span>
            <span>•</span>
            <span>{issue.environment}</span>
            <span>•</span>
            <StatusChip
              status={issue.level === 'error' ? 'danger' : issue.level === 'warning' ? 'warning' : 'info'}
              label={issue.level}
            />
            <StatusChip
              status={issue.status === 'resolved' ? 'resolved' : issue.status === 'ignored' ? 'maintenance' : 'open'}
              label={issue.status}
            />
            {issue.isRegression && (
              <span className={styles.regressionBadge}>
                {issue.regressedInRelease ? `Regression in ${issue.regressedInRelease}` : 'Regression'}
              </span>
            )}
          </div>

          <h1 className={styles.title}>{issue.title}</h1>

          <div className={styles.metaRow}>
            <span>First seen: {new Date(issue.firstSeenAt).toLocaleString()}</span>
            <span>•</span>
            <span>Last seen: {new Date(issue.lastSeenAt).toLocaleString()}</span>
            <span>•</span>
            <span>Events: {issue.eventCount.toLocaleString()}</span>
            <span>•</span>
            <span>Users: {issue.userCount.toLocaleString()}</span>
            {issue.assignedUser && (
              <>
                <span>•</span>
                <span>Assigned to {issue.assignedUser.name}</span>
              </>
            )}
          </div>

          {issue.linkedIncident && (
            <div>
              <Link
                to={`/app/incidents/${issue.linkedIncident.id}`}
                className={styles.linkedIncident}
              >
                Linked Incident: {issue.linkedIncident.title} ({issue.linkedIncident.status})
              </Link>
            </div>
          )}
        </div>

        <div className={styles.actionsRow}>
          {canUpdate && (
            <>
              {isResolved ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onReopen}
                  disabled={isUpdating}
                >
                  Reopen Issue
                </Button>
              ) : (
                <Button
                  variant="success"
                  size="sm"
                  onClick={onResolve}
                  disabled={isUpdating}
                >
                  ✓ Resolve
                </Button>
              )}

              {isIgnored ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onReopen}
                  disabled={isUpdating}
                >
                  Unignore
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onIgnore}
                  disabled={isUpdating}
                >
                  Ignore
                </Button>
              )}
            </>
          )}

          {canCreateIncident && !issue.linkedIncidentId && (
            <Button
              variant="primary"
              size="sm"
              onClick={onCreateIncidentClick}
            >
              + Create Incident
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default IssueDetailHeader;
