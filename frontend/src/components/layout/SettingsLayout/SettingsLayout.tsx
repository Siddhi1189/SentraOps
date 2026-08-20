import { Link, Outlet, useLocation } from 'react-router-dom';
import { useSession } from '../../../app/providers/SessionProvider';
import { can } from '../../../permissions/can';
import type { Permission } from '../../../permissions/can';
import styles from './SettingsLayout.module.css';

export interface SettingsTabItem {
  label: string;
  path: string;
  permission?: Permission;
}

export const SETTINGS_TABS: SettingsTabItem[] = [
  { label: 'Organization', path: '/app/settings/organization' },
  { label: 'Team', path: '/app/settings/team' },
  { label: 'Escalation Policies', path: '/app/settings/escalation-policies' },
  { label: 'Audit Log', path: '/app/settings/audit-log', permission: 'audit:read' },
];

export function SettingsLayout() {
  const location = useLocation();
  const { user } = useSession();

  const visibleTabs = SETTINGS_TABS.filter(
    (tab) => !tab.permission || can(user, tab.permission)
  );

  return (
    <div className={styles.container}>
      <div className={styles.layoutGrid}>
        {/* Left Rail / Navigation Landmark */}
        <nav className={styles.railNav} aria-label="Settings Navigation">
          {visibleTabs.map((tab) => {
            const isActive = location.pathname.startsWith(tab.path) || location.pathname.startsWith(tab.path.replace('/app', ''));
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`${styles.railLink} ${isActive ? styles.railLinkActive : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {/* Content Outlet for Sub-Routes */}
        <div className={styles.contentOutlet}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
