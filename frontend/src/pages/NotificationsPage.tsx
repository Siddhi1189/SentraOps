import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../api/notifications';
import { notificationsKeys } from '../lib/queryKeys';
import { Table, TableHeader, TableBody, TableRow, TableCell, TablePagination } from '../components/ui/Table/Table';
import { EmptyState } from '../components/ui/EmptyState/EmptyState';
import { Skeleton } from '../components/ui/Skeleton/Skeleton';
import { ErrorState } from '../components/ui/ErrorState/ErrorState';
import { Button } from '../components/ui/Button/Button';
import { PageHeader } from '../components/ui/PageHeader/PageHeader';
import { StatusChip } from '../components/ui/StatusChip/StatusChip';
import styles from './NotificationsPage.module.css';

export function NotificationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const limit = 10;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: notificationsKeys.list({ status: statusFilter, page, limit }),
    queryFn: () =>
      fetchNotifications({
        page,
        limit,
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
      }),
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
    },
  });

  const notifications = data?.data?.notifications || [];
  const total = (data as unknown as { meta?: { total?: number } })?.meta?.total ?? notifications.length;
  const unreadCount = data?.data?.unreadCount || 0;

  const handleRowClick = (item: (typeof notifications)[0]) => {
    if (!item.isRead) {
      markReadMutation.mutate(item.id);
    }
    if (item.incident?.id) {
      navigate('/app/incidents');
    } else if (item.maintenance?.id) {
      navigate('/app/maintenance');
    }
  };

  return (
    <div className={styles.container}>
      <PageHeader
        title="Notifications"
        description="Review platform alerts, dispatches, and delivery status across channels."
        actions={
          unreadCount > 0 ? (
            <Button
              variant="secondary"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      {/* Filter Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          <label htmlFor="status-filter" className={styles.filterLabel}>
            Status:
          </label>
          <select
            id="status-filter"
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All statuses</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        {unreadCount > 0 && (
          <span className={styles.unreadBadge}>{unreadCount} unread</span>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className={styles.skeletonContainer}>
          <Skeleton height={48} />
          <Skeleton height={48} />
          <Skeleton height={48} />
          <Skeleton height={48} />
        </div>
      ) : isError ? (
        <ErrorState
          title="Failed to load notifications"
          message={(error as Error)?.message || 'An unexpected error occurred.'}
          onRetry={() => refetch()}
        />
      ) : notifications.length === 0 ? (
        <EmptyState
          title="No notifications found"
          description={
            statusFilter !== 'all'
              ? `No notifications currently match the "${statusFilter}" status filter.`
              : 'You have no notifications in your organization.'
          }
        />
      ) : (
        <div className={styles.tableCard}>
          <Table responsive>
            <TableHeader>
              <TableRow>
                <TableCell as="th">Title</TableCell>
                <TableCell as="th">Channel</TableCell>
                <TableCell as="th">Recipient</TableCell>
                <TableCell as="th">Status</TableCell>
                <TableCell as="th">Date</TableCell>
                <TableCell as="th">Read</TableCell>
                <TableCell as="th">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((item) => {
                const chipStatus =
                  item.status === 'sent'
                    ? 'up'
                    : item.status === 'failed'
                    ? 'down'
                    : 'maintenance';

                return (
                  <TableRow
                    key={item.id}
                    interactive
                    className={item.isRead ? styles.readRow : styles.unreadRow}
                    onClick={() => handleRowClick(item)}
                  >
                    <TableCell dataLabel="Title">
                      <span className={styles.itemTitle}>{item.title}</span>
                    </TableCell>
                    <TableCell dataLabel="Channel">
                      <span className={styles.channelBadge}>{item.channel}</span>
                    </TableCell>
                    <TableCell dataLabel="Recipient">
                      <span className={styles.recipientText}>{item.recipient}</span>
                    </TableCell>
                    <TableCell dataLabel="Status">
                      <StatusChip status={chipStatus} label={item.status} />
                    </TableCell>
                    <TableCell dataLabel="Date">
                      <span className={styles.dateText}>
                        {new Date(item.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </TableCell>
                    <TableCell dataLabel="Read">
                      <span
                        className={
                          item.isRead ? styles.readIndicator : styles.unreadIndicator
                        }
                      >
                        {item.isRead ? 'Read' : 'New'}
                      </span>
                    </TableCell>
                    <TableCell dataLabel="Actions">
                      {!item.isRead && (
                        <button
                          type="button"
                          className={styles.markReadBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            markReadMutation.mutate(item.id);
                          }}
                        >
                          Mark read
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {total > limit && (
            <TablePagination
              page={page}
              limit={limit}
              total={total}
              onPageChange={(newPage) => setPage(newPage)}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
