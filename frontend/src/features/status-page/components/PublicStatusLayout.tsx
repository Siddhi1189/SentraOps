import type React from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { StatusPageSettings } from '../../../api/status';
import { SubscribeButton } from './SubscribeButton';
import styles from './PublicStatusLayout.module.css';

export interface PublicStatusLayoutProps {
  orgSlug: string;
  settings?: StatusPageSettings | null | undefined;
  children: React.ReactNode;
}

export function PublicStatusLayout({ orgSlug, settings, children }: PublicStatusLayoutProps) {
  const location = useLocation();

  const companyName = settings?.companyName || settings?.organization?.name || orgSlug || 'System Status';
  const logoUrl = settings?.logoUrl;

  const isOverview = location.pathname === `/status/${orgSlug}` || location.pathname === `/status/${orgSlug}/`;
  const isIncidents = location.pathname.startsWith(`/status/${orgSlug}/incidents`);
  const isMaintenance = location.pathname.startsWith(`/status/${orgSlug}/maintenance`);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to={`/status/${orgSlug}`} className={styles.brand}>
            {logoUrl ? (
              <img src={logoUrl} alt={`${companyName} logo`} className={styles.logo} />
            ) : null}
            <h1 className={styles.title}>{companyName} Status</h1>
          </Link>

          <div className={styles.headerRight}>
            <nav className={styles.nav} aria-label="Public Status Navigation">
              <Link
                to={`/status/${orgSlug}`}
                className={`${styles.navLink} ${isOverview ? styles.activeNavLink : ''}`}
              >
                Status Overview
              </Link>
              <Link
                to={`/status/${orgSlug}/incidents`}
                className={`${styles.navLink} ${isIncidents ? styles.activeNavLink : ''}`}
              >
                Incident History
              </Link>
              <Link
                to={`/status/${orgSlug}/maintenance`}
                className={`${styles.navLink} ${isMaintenance ? styles.activeNavLink : ''}`}
              >
                Maintenance Schedule
              </Link>
            </nav>

            <SubscribeButton companyName={companyName} orgSlug={orgSlug} />
          </div>
        </div>
      </header>

      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>
        <Link to="/" className={styles.poweredByLink}>
          Powered by SentraOps
        </Link>
      </footer>
    </div>
  );
}
