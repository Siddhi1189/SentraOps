import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSession } from '../../../app/providers/SessionProvider';
import { can, type Permission } from '../../../permissions/can';
import styles from './Navigation.module.css';

export interface NavItem {
  label: string;
  path: string;
  requiredPermission?: Permission;
  icon: React.ReactNode;
}

export function Navigation() {
  const location = useLocation();
  const { user } = useSession();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const NAV_ITEMS: NavItem[] = [
    {
      label: 'Overview',
      path: '/app',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      label: 'Services',
      path: '/app/services',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
      ),
    },
    {
      label: 'Incidents',
      path: '/app/incidents',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
    },
    {
      label: 'Maintenance',
      path: '/app/maintenance',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      ),
    },
    {
      label: 'Escalations',
      path: '/app/settings/escalation-policies',
      requiredPermission: 'escalation:manage',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="16 12 12 8 8 12" />
          <line x1="12" y1="16" x2="12" y2="8" />
        </svg>
      ),
    },
    {
      label: 'Notifications',
      path: '/app/settings/team',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
    },
    {
      label: 'Analytics',
      path: '/app/analytics',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      label: 'Status Pages',
      path: '/status/acme-corp',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
    },
    {
      label: 'Audit Logs',
      path: '/app/settings/audit-log',
      requiredPermission: 'audit:read',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      label: 'Settings',
      path: '/app/settings',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  // Filter items based on user permission
  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (!item.requiredPermission) return true;
    return can(user, item.requiredPermission);
  });

  const toggleMobile = () => setIsMobileOpen((prev) => !prev);
  const closeMobile = () => setIsMobileOpen(false);

  // Mobile focus trap & Escape key dismiss handler
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeMobile();
      }

      if (event.key === 'Tab' && isMobileOpen && sheetRef.current) {
        const focusables = sheetRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus();
            event.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            event.preventDefault();
          }
        }
      }
    }

    if (isMobileOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileOpen]);

  const isPathActive = (path: string) => {
    if (path === '/app') {
      return location.pathname === '/app';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <aside className={styles.sidebar} aria-label="Application Sidebar">
        {/* Brand Header */}
        <div className={styles.brandHeader}>
          <Link to="/app" className={styles.brandLogo} aria-label="SentraOps Home">
            <svg className={styles.logoSvg} viewBox="0 0 36 36" fill="none" aria-hidden="true">
              <path d="M18 3L32 10.5V25.5L18 33L4 25.5V10.5L18 3Z" fill="#0B1F2A" stroke="#E8A33D" strokeWidth="1.5" />
              <path d="M18 3L32 10.5L18 18L4 10.5L18 3Z" fill="#E8A33D" fillOpacity="0.9" />
              <path d="M18 18V33L32 25.5V10.5L18 18Z" fill="#132E3E" />
              <path d="M18 18V33L4 25.5V10.5L18 18Z" fill="#0B1F2A" />
              <path d="M18 12L25 15.5M18 12L11 15.5M18 12V6.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="18" cy="18" r="2" fill="#E8A33D" />
            </svg>
            <div className={styles.brandText}>
              <span className={styles.brandTitle}>SentraOps</span>
              <span className={styles.brandSubtitle}>Monitor. Detect. Recover.</span>
            </div>
          </Link>
        </div>

        {/* Vertical Navigation List */}
        <nav className={styles.sidebarNav} aria-label="Main Navigation">
          {visibleNavItems.map((item) => {
            const active = isPathActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Sidebar Promo / Help Cards */}
        <div className={styles.sidebarBottom}>
          {/* 14-Day Free Trial Upsell Card */}
          <div className={styles.trialCard}>
            <div className={styles.trialHeader}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E8A33D" strokeWidth="2.2">
                <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z" />
              </svg>
              <span className={styles.trialTitle}>14-Day Free Trial</span>
            </div>
            <p className={styles.trialText}>Your trial ends in 10 days</p>
            <Link to="/#pricing" className={styles.upgradeBtn}>
              Upgrade Now
            </Link>
          </div>

          {/* Need Help Card */}
          <div className={styles.helpCard}>
            <div className={styles.helpTitle}>Need Help?</div>
            <p className={styles.helpText}>Check our documentation or contact support.</p>
            <Link to="/contact" className={styles.helpLink}>
              <span>Visit Help Center</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Trigger & Sheet Drawer */}
      <button
        type="button"
        className={styles.mobileToggle}
        onClick={toggleMobile}
        aria-expanded={isMobileOpen}
        aria-label="Toggle Navigation"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {isMobileOpen && (
        <div className={styles.mobileOverlay} onClick={closeMobile} data-testid="mobile-overlay">
          <div
            className={styles.mobileSheet}
            ref={sheetRef}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Mobile Navigation"
            aria-modal="true"
          >
            <div className={styles.mobileSheetHeader}>
              <div className={styles.brandText}>
                <span className={styles.brandTitle}>SentraOps</span>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={closeMobile}
                aria-label="Close Navigation"
              >
                &times;
              </button>
            </div>

            <nav className={styles.mobileNavList} aria-label="Mobile Main Navigation">
              {visibleNavItems.map((item) => {
                const active = isPathActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`${styles.mobileNavLink} ${active ? styles.mobileNavLinkActive : ''}`}
                    aria-current={active ? 'page' : undefined}
                    onClick={closeMobile}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
