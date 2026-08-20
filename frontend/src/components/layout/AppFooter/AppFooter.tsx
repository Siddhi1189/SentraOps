import { Link } from 'react-router-dom';
import styles from './AppFooter.module.css';

export function AppFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.topRow}>
          <div className={styles.brandCol}>
            <span className={styles.brandName}>SentraOps</span>
            <p className={styles.brandTagline}>
              High-consequence incident management, service monitoring, and operational reliability console.
            </p>
          </div>

          <div className={styles.linkCol}>
            <span className={styles.colHeader}>Console</span>
            <ul className={styles.linkList}>
              <li><Link to="/app" className={styles.footerLink}>Overview Dashboard</Link></li>
              <li><Link to="/app/services" className={styles.footerLink}>Services Registry</Link></li>
              <li><Link to="/app/incidents" className={styles.footerLink}>Incident Queue</Link></li>
              <li><Link to="/app/maintenance" className={styles.footerLink}>Maintenance Schedule</Link></li>
              <li><Link to="/app/analytics" className={styles.footerLink}>Operational Analytics</Link></li>
            </ul>
          </div>

          <div className={styles.linkCol}>
            <span className={styles.colHeader}>Administration</span>
            <ul className={styles.linkList}>
              <li><Link to="/status/acme-corp" className={styles.footerLink}>Public Status Page</Link></li>
              <li><Link to="/app/settings/organization" className={styles.footerLink}>Organization Profile</Link></li>
              <li><Link to="/app/settings/team" className={styles.footerLink}>Members &amp; Roles</Link></li>
              <li><Link to="/app/settings/escalation-policies" className={styles.footerLink}>Escalation Policies</Link></li>
              <li><Link to="/app/settings/audit-log" className={styles.footerLink}>Audit Event Log</Link></li>
            </ul>
          </div>

          <div className={styles.linkCol}>
            <span className={styles.colHeader}>Telemetry</span>
            <ul className={styles.linkList}>
              <li><span className={styles.footerLink}>OCC Engine: Active</span></li>
              <li><span className={styles.footerLink}>Socket Gateway: Connected</span></li>
              <li><span className={styles.footerLink}>Event Pipeline: Operational</span></li>
            </ul>
          </div>
        </div>

        <div className={styles.bottomRow}>
          <div className={styles.statusIndicator}>
            <span className={styles.dot} />
            <span>SentraOps Operator Console</span>
          </div>
          <span>&copy; {new Date().getFullYear()} SentraOps Inc. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
