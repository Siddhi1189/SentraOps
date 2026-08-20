import { useState } from 'react';
import type { AuditLog } from '../../../../types/domain';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
} from '../../../../components/ui/Table/Table';

export interface AuditLogTableProps {
  logs: AuditLog[];
  page: number;
  limit: number;
  total: number;
  onPageChange: (newPage: number) => void;
}

export function AuditLogTable({
  logs,
  page,
  limit,
  total,
  onPageChange,
}: AuditLogTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatAction = (action: string) => {
    if (!action) return 'Unknown Action';
    const actionMap: Record<string, string> = {
      'member.invited': 'Member Invited',
      'member.role_changed': 'Member Role Changed',
      'member.removed': 'Member Removed',
      'user.invite_accepted': 'Invite Accepted',
      'service.created': 'Service Created',
      'service.updated': 'Service Updated',
      'service.deleted': 'Service Deleted',
      'incident.created': 'Incident Created',
      'incident.resolved': 'Incident Resolved',
      'maintenance.created': 'Maintenance Window Created',
      'maintenance.updated': 'Maintenance Window Updated',
      'maintenance.deleted': 'Maintenance Window Deleted',
      'escalation.created': 'Escalation Policy Created',
      'escalation.updated': 'Escalation Policy Updated',
      'escalation.deleted': 'Escalation Policy Deleted',
    };

    if (actionMap[action]) return actionMap[action];

    // Fallback formatting for unknown action strings
    return action
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return iso;
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (logs.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: 'var(--space-8, 32px)',
          color: 'var(--color-text-muted, #64748b)',
          backgroundColor: 'var(--color-bg-surface, #ffffff)',
          borderRadius: 'var(--radius-lg, 8px)',
          border: '1px solid var(--color-border, #e2e8f0)',
        }}
      >
        No activity recorded yet.
      </div>
    );
  }

  return (
    <div>
      <Table responsive>
        <TableHeader>
          <TableRow>
            <TableCell as="th">Timestamp</TableCell>
            <TableCell as="th">Action</TableCell>
            <TableCell as="th">Entity Type</TableCell>
            <TableCell as="th">User</TableCell>
            <TableCell as="th" style={{ textAlign: 'right' }}>
              Details
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const isExpanded = expandedId === log.id;
            const userName = log.user?.name || log.user?.email || (log.userId ? log.userId.substring(0, 8) : 'System');
            const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;

            return (
              <React.Fragment key={log.id}>
                <TableRow interactive onClick={() => toggleExpand(log.id)}>
                  <TableCell dataLabel="Timestamp" style={{ fontSize: '0.875rem' }}>
                    {formatDate(log.createdAt)}
                  </TableCell>
                  <TableCell dataLabel="Action">
                    <span style={{ fontWeight: 600 }}>{formatAction(log.action)}</span>
                  </TableCell>
                  <TableCell dataLabel="Entity Type">{log.entityType}</TableCell>
                  <TableCell dataLabel="User">{userName}</TableCell>
                  <TableCell dataLabel="Details" style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-primary, #2563eb)',
                        cursor: 'pointer',
                        fontWeight: 500,
                        fontSize: '0.875rem',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(log.id);
                      }}
                    >
                      {isExpanded ? 'Hide' : 'Inspect'}
                    </button>
                  </TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow key={`${log.id}-detail`}>
                    <TableCell colSpan={5} style={{ backgroundColor: 'var(--color-bg-subtle, #f8fafc)', padding: '16px' }}>
                      <div style={{ fontSize: '0.875rem' }}>
                        <div style={{ marginBottom: '8px', fontWeight: 600 }}>
                          Action Details & Metadata
                        </div>
                        {hasMetadata ? (
                          <pre
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '0.8125rem',
                              backgroundColor: 'var(--color-bg-surface, #ffffff)',
                              padding: '12px',
                              borderRadius: '4px',
                              border: '1px solid var(--color-border, #e2e8f0)',
                              overflowX: 'auto',
                              margin: 0,
                            }}
                          >
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted, #64748b)', fontStyle: 'italic' }}>
                            No additional metadata recorded for this action.
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>

      {total > limit && (
        <TablePagination
          page={page}
          limit={limit}
          total={total}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}

// React import for React.Fragment syntax
import React from 'react';
