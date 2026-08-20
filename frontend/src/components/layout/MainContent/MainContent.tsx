import { Outlet } from 'react-router-dom';
import { NotificationsMenu } from '../NotificationsMenu/NotificationsMenu';
import { OrgUserMenu } from '../OrgUserMenu/OrgUserMenu';
import styles from './MainContent.module.css';

export function MainContent() {
  return (
    <div className={styles.mainWrapper}>
      {/* Top Bar Header */}
      <header className={styles.topBar}>
        {/* Search Input Box */}
        <div className={styles.searchBox}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search services, incidents, alerts..."
            aria-label="Search platform"
          />
        </div>

        {/* Right Action Controls */}
        <div className={styles.topBarRight}>
          {/* Interactive Notification Bell with Dropdown Panel */}
          <NotificationsMenu />

          {/* Org & User Menu */}
          <OrgUserMenu />
        </div>
      </header>

      {/* Main Routed Page Content */}
      <main className={styles.pageContent}>
        <Outlet />
      </main>
    </div>
  );
}
