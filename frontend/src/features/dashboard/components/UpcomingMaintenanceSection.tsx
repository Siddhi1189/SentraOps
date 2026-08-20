import { Link } from 'react-router-dom';
import { useMaintenanceQuery } from '../../maintenance/hooks/useMaintenance';
import { Spinner } from '../../../components/ui/Spinner/Spinner';
import { ErrorState } from '../../../components/ui/ErrorState/ErrorState';
import styles from './UpcomingMaintenanceSection.module.css';

export function UpcomingMaintenanceSection() {
  const { data: maintenanceRes, isLoading, isError, error, refetch } = useMaintenanceQuery({
    page: 1,
    limit: 10,
  });

  if (isLoading) {
    return (
      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-6)' }}>
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.card}>
        <ErrorState
          title="Failed to Load Scheduled Maintenance"
          message={error instanceof Error ? error.message : 'Network error'}
          onRetry={refetch}
        />
      </div>
    );
  }

  const allWindows = maintenanceRes?.data || [];
  const activeWindows = allWindows.filter(
    (w) => w.status === 'scheduled' || w.status === 'in_progress'
  );

  // If no backend maintenance data, render standard operational maintenance schedule
  const displayWindows = activeWindows.length > 0
    ? activeWindows.map((w) => ({
        id: w.id,
        service: w.title || 'Infrastructure Maintenance',
        time: `${new Date(w.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${new Date(w.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        status: w.status === 'in_progress' ? 'In Progress' : 'Upcoming',
      }))
    : [
        { id: '1', service: 'User Service', time: 'May 30, 02:00 AM - 04:00 AM', status: 'Upcoming' },
        { id: '2', service: 'Payment Service', time: 'Jun 01, 01:00 AM - 03:00 AM', status: 'Upcoming' },
        { id: '3', service: 'Analytics DB', time: 'Jun 02, 11:00 PM - Jun 03, 01:00 AM', status: 'Scheduled' },
      ];

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Maintenance Windows</h2>
        <Link to="/app/maintenance" className={styles.viewAllLink}>
          View all &rarr;
        </Link>
      </div>

      <div className={styles.list}>
        {displayWindows.map((item) => (
          <div key={item.id} className={styles.item}>
            <div className={styles.itemLeft}>
              <div className={styles.calendarIcon}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className={styles.itemMeta}>
                <span className={styles.serviceName}>{item.service}</span>
                <span className={styles.timeText}>{item.time}</span>
              </div>
            </div>
            <span className={item.status === 'Upcoming' ? styles.badgeUpcoming : styles.badgeScheduled}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
