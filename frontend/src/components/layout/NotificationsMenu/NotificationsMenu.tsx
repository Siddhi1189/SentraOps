import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsKeys } from '../../../lib/queryKeys';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type NotificationItem,
} from '../../../api/notifications';
import styles from './NotificationsMenu.module.css';

function formatRelativeTime(dateString: string): string {
  try {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay}d ago`;
  } catch {
    return 'Recently';
  }
}

export function NotificationsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Query notifications with 30s polling and refetch on window focus
  const { data } = useQuery({
    queryKey: notificationsKeys.list(),
    queryFn: () => fetchNotifications({ limit: 10 }),
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  const notifications = data?.data?.notifications || [];
  const unreadCount = data?.data?.unreadCount || 0;

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

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markReadMutation.mutate(item.id);
    }
    closeMenu();

    if (item.incident?.id) {
      navigate('/app/incidents');
    } else if (item.maintenance?.id) {
      navigate('/app/maintenance');
    }
  };

  // Close on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeMenu();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const severityColorMap: Record<string, string> = {
    critical: '#EF4444',
    high: '#F97316',
    medium: '#EAB308',
    low: '#3B82F6',
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={`${styles.bellButton} ${isOpen ? styles.bellButtonActive : ''}`}
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications (no unread)'}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && <span className={styles.bellBadge}>{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="dialog" aria-label="Notifications panel">
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerTitleRow}>
              <h3 className={styles.title}>Notifications</h3>
              {unreadCount > 0 && (
                <span className={styles.countBadge}>{unreadCount} new</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                className={styles.markReadBtn}
                onClick={handleMarkAllRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className={styles.list}>
            {notifications.length === 0 ? (
              <div className={styles.emptyState}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" aria-hidden="true">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <p className={styles.emptyText}>All caught up! No notifications.</p>
              </div>
            ) : (
              notifications.map((item) => {
                const severity = item.incident?.severity || 'low';
                const color = severityColorMap[severity] || '#3B82F6';

                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    className={`${styles.item} ${item.isRead ? styles.itemRead : ''}`}
                    onClick={() => handleNotificationClick(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleNotificationClick(item);
                      }
                    }}
                  >
                    <span className={styles.dot} style={{ backgroundColor: color }} />
                    <div className={styles.itemContent}>
                      <span className={styles.itemTitle}>{item.title}</span>
                      <span className={styles.itemTime}>{formatRelativeTime(item.createdAt)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <Link to="/app/notifications" className={styles.viewAllLink} onClick={closeMenu}>
              View All Notifications &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
export default NotificationsMenu;
