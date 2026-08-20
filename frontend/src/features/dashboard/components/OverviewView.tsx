import { useSession } from '../../../app/providers/SessionProvider';
import { AttentionBandSection } from './AttentionBandSection';
import { ServiceStatusRollupSection } from './ServiceStatusRollupSection';
import { DashboardStatCards } from './DashboardStatCards';
import { UptimeLineChartCard } from './UptimeLineChartCard';
import { RecentIncidentsSection } from './RecentIncidentsSection';
import { TopAffectedServicesDonut } from './TopAffectedServicesDonut';
import { SystemHealthOverview } from './SystemHealthOverview';
import { UpcomingMaintenanceSection } from './UpcomingMaintenanceSection';
import { AlertsSummaryCard } from './AlertsSummaryCard';
import { IncidentTrendsBarCard } from './IncidentTrendsBarCard';
import { QuickActionsCard } from './QuickActionsCard';
import styles from './OverviewView.module.css';

export function OverviewView() {
  const { user } = useSession();
  const userName = user?.name ? user.name.split(' ')[0] : 'John';

  return (
    <div className={styles.container}>
      {/* Overview Top Header Banner */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>Overview</h1>
          <p className={styles.pageSubtitle}>
            Welcome back, {userName}! Here&apos;s what&apos;s happening with your systems.
          </p>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.dateChip}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>May 23 &ndash; May 29, 2025</span>
          </div>

          <button type="button" className={styles.exportBtn} onClick={() => window.print()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Attention Band Alert if active incidents exist */}
      <AttentionBandSection />

      {/* Row 1: 4 Stat Cards */}
      <DashboardStatCards />

      {/* Row 2: Uptime Line Chart (45%) | Recent Incidents (28%) | Top Affected Services Donut (27%) */}
      <div className={styles.rowTwoGrid}>
        <div className={styles.uptimeCol}>
          <UptimeLineChartCard />
        </div>
        <div className={styles.incidentsCol}>
          <RecentIncidentsSection />
        </div>
        <div className={styles.donutCol}>
          <TopAffectedServicesDonut />
        </div>
      </div>

      {/* Row 3: System Health Overview (4 Mini Cards) */}
      <SystemHealthOverview />

      {/* Real-time Service Status Rollup Chips */}
      <div className={styles.serviceRollupWrap}>
        <ServiceStatusRollupSection />
      </div>

      {/* Row 4: Maintenance (35%) | Alerts & Trends (38%) | Quick Actions (27%) */}
      <div className={styles.rowFourGrid}>
        <div className={styles.maintenanceCol}>
          <UpcomingMaintenanceSection />
        </div>
        <div className={styles.alertsTrendsCol}>
          <AlertsSummaryCard />
          <IncidentTrendsBarCard />
        </div>
        <div className={styles.actionsCol}>
          <QuickActionsCard />
        </div>
      </div>
    </div>
  );
}
