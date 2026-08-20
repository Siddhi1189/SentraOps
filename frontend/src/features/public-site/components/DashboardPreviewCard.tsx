import styles from './DashboardPreviewCard.module.css';

export function DashboardPreviewCard() {
  return (
    <div className={styles.mockupContainer}>
      {/* Left Navy Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>
            <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
              <path d="M18 3L32 10.5V25.5L18 33L4 25.5V10.5L18 3Z" fill="#0B1F2A" stroke="#E8A33D" strokeWidth="1.5" />
              <path d="M18 3L32 10.5L18 18L4 10.5L18 3Z" fill="#E8A33D" />
              <path d="M18 18V33L32 25.5V10.5L18 18Z" fill="#1E3E50" />
              <path d="M18 18V33L4 25.5V10.5L18 18Z" fill="#0B1F2A" />
            </svg>
            <span className={styles.sidebarBrandName}>SentraOps</span>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          <div className={`${styles.navItem} ${styles.navItemActive}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
            <span>Overview</span>
          </div>
          <div className={styles.navItem}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="8" rx="2" />
              <rect x="2" y="14" width="20" height="8" rx="2" />
              <line x1="6" y1="6" x2="6.01" y2="6" />
              <line x1="6" y1="18" x2="6.01" y2="18" />
            </svg>
            <span>Services</span>
          </div>
          <div className={styles.navItem}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>Incidents</span>
          </div>
          <div className={styles.navItem}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Maintenance</span>
          </div>
          <div className={styles.navItem}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Escalations</span>
          </div>
          <div className={styles.navItem}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span>Notifications</span>
          </div>
          <div className={styles.navItem}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span>Analytics</span>
          </div>
          <div className={styles.navItem}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>Status Pages</span>
          </div>
          <div className={styles.navItem}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>Audit Logs</span>
          </div>
          <div className={styles.navItem}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Settings</span>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        {/* Top bar */}
        <header className={styles.topBar}>
          <div className={styles.searchBar}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8E99A4" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search services, incidents, alerts..."
              readOnly
            />
          </div>

          <div className={styles.topBarRight}>
            <div className={styles.bellWrap}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#5F6B76" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className={styles.bellDot} />
            </div>

            <div className={styles.orgPill}>
              <div className={styles.userAvatar}>
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces"
                  alt="User avatar"
                  className={styles.avatarImg}
                />
              </div>
              <div className={styles.orgText}>
                <span className={styles.orgName}>Acme Corp</span>
                <span className={styles.orgRole}>Owner</span>
              </div>
            </div>
          </div>
        </header>

        {/* 4 Stat Tiles */}
        <div className={styles.statTilesGrid}>
          {/* Tile 1 */}
          <div className={styles.statTile}>
            <div className={styles.statLabel}>Total Services</div>
            <div className={styles.statValue}>248</div>
            <div className={styles.statTrendPositive}>
              <span>↑ 15% vs last 7 days</span>
            </div>
          </div>

          {/* Tile 2 */}
          <div className={styles.statTile}>
            <div className={styles.statLabel}>Open Incidents</div>
            <div className={styles.statValue}>14</div>
            <div className={styles.statTrendNegative}>
              <span>↓ 8% vs last week</span>
            </div>
          </div>

          {/* Tile 3 */}
          <div className={styles.statTile}>
            <div className={styles.statLabel}>Healthy Services</div>
            <div className={styles.statValue}>892</div>
            <div className={styles.statTrendPositive}>
              <span>↑ 2% vs last month</span>
            </div>
          </div>

          {/* Tile 4 */}
          <div className={styles.statTile}>
            <div className={styles.statLabel}>Uptime (30d)</div>
            <div className={styles.statValue}>99.99%</div>
            <div className={styles.statTrendPositive}>
              <span>Excellent</span>
            </div>
          </div>
        </div>

        {/* 2 Side-by-Side Data Panels */}
        <div className={styles.panelsGrid}>
          {/* Service Uptime Line Chart Card */}
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>Service Uptime (Last 30 Days)</span>
            </div>

            <div className={styles.chartContainer}>
              <div className={styles.yAxis}>
                <span>100%</span>
                <span>99%</span>
                <span>98%</span>
                <span>97%</span>
                <span>96%</span>
              </div>

              <div className={styles.chartArea}>
                <svg className={styles.chartSvg} viewBox="0 0 300 120" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Guide Lines */}
                  <line x1="0" y1="10" x2="300" y2="10" stroke="#F1F5F9" strokeWidth="1" />
                  <line x1="0" y1="35" x2="300" y2="35" stroke="#F1F5F9" strokeWidth="1" />
                  <line x1="0" y1="60" x2="300" y2="60" stroke="#F1F5F9" strokeWidth="1" />
                  <line x1="0" y1="85" x2="300" y2="85" stroke="#F1F5F9" strokeWidth="1" />
                  <line x1="0" y1="110" x2="300" y2="110" stroke="#F1F5F9" strokeWidth="1" />

                  {/* Gradient Area */}
                  <polygon
                    points="0,95 20,90 50,70 85,68 120,62 155,50 190,44 230,42 270,38 300,30 300,120 0,120"
                    fill="url(#chartGradient)"
                  />

                  {/* Smooth Sparkline */}
                  <polyline
                    points="0,95 20,90 50,70 85,68 120,62 155,50 190,44 230,42 270,38 300,30"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Highlight Dots */}
                  <circle cx="50" cy="70" r="3" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2" />
                  <circle cx="155" cy="50" r="3" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2" />
                  <circle cx="300" cy="30" r="3.5" fill="#2563EB" />
                </svg>

                <div className={styles.xAxis}>
                  <span>May 1</span>
                  <span>May 8</span>
                  <span>May 15</span>
                  <span>May 22</span>
                  <span>May 29</span>
                </div>
              </div>
            </div>

            <div className={styles.chartLegend}>
              <span className={styles.legendLine} />
              <span className={styles.legendText}>Uptime %</span>
            </div>
          </div>

          {/* Recent Incidents List Card */}
          <div className={styles.panelCard}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>Recent Incidents</span>
            </div>

            <div className={styles.incidentsList}>
              <div className={styles.incidentRow}>
                <span className={`${styles.statusDot} ${styles.dotCritical}`} />
                <div className={styles.incidentDetails}>
                  <div className={styles.incidentName}>API Gateway Timeout</div>
                  <div className={styles.incidentMeta}>Critical &bull; 2m ago</div>
                </div>
              </div>

              <div className={styles.incidentRow}>
                <span className={`${styles.statusDot} ${styles.dotMajor}`} />
                <div className={styles.incidentDetails}>
                  <div className={styles.incidentName}>Payment Service 5XX</div>
                  <div className={styles.incidentMeta}>Major &bull; 15m ago</div>
                </div>
              </div>

              <div className={styles.incidentRow}>
                <span className={`${styles.statusDot} ${styles.dotMinor}`} />
                <div className={styles.incidentDetails}>
                  <div className={styles.incidentName}>User Service Slow Response</div>
                  <div className={styles.incidentMeta}>Minor &bull; 1h ago</div>
                </div>
              </div>

              <div className={styles.incidentRow}>
                <span className={`${styles.statusDot} ${styles.dotMajor}`} />
                <div className={styles.incidentDetails}>
                  <div className={styles.incidentName}>Inventory Service Down</div>
                  <div className={styles.incidentMeta}>Major &bull; 2h ago</div>
                </div>
              </div>
            </div>

            <div className={styles.incidentsFooter}>
              <span className={styles.viewAllLink}>
                View all incidents &rarr;
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
