import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './NotificationsMenu.module.css';

export interface NotificationItem {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  time: string;
  link: string;
}

export function NotificationsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [markedAsRead, setMarkedAsRead] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // TODO: replace with real notifications list once backend endpoint exists (e.g. GET /api/v1/notifications)
  // Backend currently only dispatches outbound notifications (Email/Slack/Webhook) and Socket.IO events;
  // no persistent in-app notifications REST endpoint exists yet.
  const notificationItems: NotificationItem[] = [
    {
      id: 'notif-1',
      title: 'API Gateway timeout alert detected',
      severity: 'critical',
      time: '5m ago',
      link: '/app/incidents',
    },
    {
      id: 'notif-2',
      title: 'Payment Service high latency warning',
      severity: 'high',
      time: '20m ago',
      link: '/app/incidents',
    },
    {
      id: 'notif-3',
      title: 'Upcoming maintenance window scheduled',
      severity: 'low',
      time: '1h ago',
      link: '/app/maintenance',
    },
  ];

  const unreadCount = markedAsRead ? 0 : notificationItems.length;

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  const handleMarkAllRead = () => {
    // TODO: wire to backend PATCH /api/v1/notifications/read-all when endpoint exists
    setMarkedAsRead(true);
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
            {markedAsRead ? (
              <div className={styles.emptyState}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" aria-hidden="true">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <p className={styles.emptyText}>All caught up! No unread notifications.</p>
              </div>
            ) : (
              notificationItems.map((item) => {
                const color = severityColorMap[item.severity] || '#3B82F6';

                return (
                  <Link
                    key={item.id}
                    to={item.link}
                    className={styles.item}
                    onClick={closeMenu}
                  >
                    <span className={styles.dot} style={{ backgroundColor: color }} />
                    <div className={styles.itemContent}>
                      <span className={styles.itemTitle}>{item.title}</span>
                      <span className={styles.itemTime}>{item.time}</span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <Link to="/app/incidents" className={styles.viewAllLink} onClick={closeMenu}>
              View All Incidents &amp; Alerts &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
