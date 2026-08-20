import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './PublicNavbar.module.css';

export interface PublicNavItem {
  label: string;
  path: string;
  isExternal?: boolean;
  hasDropdown?: boolean;
}

export const NAV_LINKS: PublicNavItem[] = [
  { label: 'Features', path: '/#features' },
  { label: 'How It Works', path: '/#how-it-works' },
  { label: 'Pricing', path: '/#pricing' },
  { label: 'Documentation', path: '/platform' },
  { label: 'Resources', path: '/#resources', hasDropdown: true },
  { label: 'Status', path: '/status/acme-corp' },
];

export function PublicNavbar() {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMobileOpen(false);
    setResourcesOpen(false);
  }, [location.pathname, location.hash]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setResourcesOpen(true);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setResourcesOpen(false);
    }, 150);
  };

  const handleTriggerClick = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setResourcesOpen((prev) => !prev);
  };

  // Keyboard accessibility and click-outside dismissal
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setResourcesOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setResourcesOpen(false);
      }
    }

    if (resourcesOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [resourcesOpen]);

  return (
    <header className={styles.header}>
      <div className={styles.navContainer}>
        {/* Brand Logo & Wordmark */}
        <Link to="/" className={styles.brand} aria-label="SentraOps Home">
          <div className={styles.logoMarkWrap}>
            <svg
              className={styles.logoSvg}
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Isometric Cube Shape */}
              <path
                d="M18 3L32 10.5V25.5L18 33L4 25.5V10.5L18 3Z"
                fill="#0B1F2A"
                stroke="#E8A33D"
                strokeWidth="1.5"
              />
              <path
                d="M18 3L32 10.5L18 18L4 10.5L18 3Z"
                fill="#E8A33D"
                fillOpacity="0.85"
              />
              <path
                d="M18 18V33L32 25.5V10.5L18 18Z"
                fill="#132E3E"
              />
              <path
                d="M18 18V33L4 25.5V10.5L18 18Z"
                fill="#0B1F2A"
              />
              {/* Internal geometric circuitry */}
              <path
                d="M18 12L25 15.5M18 12L11 15.5M18 12V6.5"
                stroke="#FFFFFF"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <circle cx="18" cy="18" r="2" fill="#E8A33D" />
            </svg>
          </div>
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>SentraOps</span>
            <span className={styles.brandSubtitle}>Monitor. Detect. Recover.</span>
          </div>
        </Link>

        {/* Center Desktop Navigation Links */}
        <nav className={styles.desktopNav} aria-label="Main Navigation">
          {NAV_LINKS.map((item) => {
            if (item.hasDropdown) {
              return (
                <div
                  key={item.label}
                  ref={dropdownRef}
                  className={styles.dropdownWrap}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    type="button"
                    className={`${styles.navLink} ${styles.dropdownTrigger}`}
                    onClick={handleTriggerClick}
                    aria-expanded={resourcesOpen}
                    aria-haspopup="true"
                  >
                    <span>{item.label}</span>
                    <svg
                      className={`${styles.chevron} ${resourcesOpen ? styles.chevronRotated : ''}`}
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {resourcesOpen && (
                    <div
                      className={styles.dropdownMenu}
                      role="menu"
                      aria-label="Resources submenu"
                    >
                      <Link to="/about" className={styles.dropdownItem} onClick={() => setResourcesOpen(false)} role="menuitem">
                        <div className={styles.dropdownItemTitle}>About SentraOps</div>
                        <div className={styles.dropdownItemSub}>Our mission &amp; engineering principles</div>
                      </Link>
                      <Link to="/services" className={styles.dropdownItem} onClick={() => setResourcesOpen(false)} role="menuitem">
                        <div className={styles.dropdownItemTitle}>Service Inventory</div>
                        <div className={styles.dropdownItemSub}>Topology catalog and health probes</div>
                      </Link>
                      <Link to="/incidents" className={styles.dropdownItem} onClick={() => setResourcesOpen(false)} role="menuitem">
                        <div className={styles.dropdownItemTitle}>Incident Lifecycles</div>
                        <div className={styles.dropdownItemSub}>OCC conflict-free coordination</div>
                      </Link>
                      <Link to="/maintenance" className={styles.dropdownItem} onClick={() => setResourcesOpen(false)} role="menuitem">
                        <div className={styles.dropdownItemTitle}>Maintenance Windows</div>
                        <div className={styles.dropdownItemSub}>Planned outages &amp; alert suppression</div>
                      </Link>
                      <Link to="/analytics" className={styles.dropdownItem} onClick={() => setResourcesOpen(false)} role="menuitem">
                        <div className={styles.dropdownItemTitle}>Reliability Telemetry</div>
                        <div className={styles.dropdownItemSub}>MTTD, MTTR and SLA tracking</div>
                      </Link>
                      <Link to="/contact" className={styles.dropdownItem} onClick={() => setResourcesOpen(false)} role="menuitem">
                        <div className={styles.dropdownItemTitle}>Contact Operations</div>
                        <div className={styles.dropdownItemSub}>Get in touch with our team</div>
                      </Link>
                    </div>
                  )}
                </div>
              );
            }

            const isAnchor = item.path.startsWith('/#');
            if (isAnchor) {
              return (
                <a key={item.label} href={item.path.replace('/', '')} className={styles.navLink}>
                  {item.label}
                </a>
              );
            }

            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Auth / Action CTAs */}
        <div className={styles.authGroup}>
          <Link to="/login" className={styles.loginBtn}>
            Log In
          </Link>
          <Link to="/register" className={styles.trialBtn}>
            Start Free Trial
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          className={styles.mobileToggle}
          onClick={() => setIsMobileOpen(true)}
          aria-label="Open Navigation Menu"
          aria-expanded={isMobileOpen}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className={styles.mobileOverlay} onClick={() => setIsMobileOpen(false)}>
          <div
            className={styles.mobileSheet}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Mobile Navigation"
          >
            <div className={styles.mobileHeader}>
              <div className={styles.brand}>
                <div className={styles.logoMarkWrap}>
                  <svg className={styles.logoSvg} viewBox="0 0 36 36" fill="none">
                    <path d="M18 3L32 10.5V25.5L18 33L4 25.5V10.5L18 3Z" fill="#0B1F2A" stroke="#E8A33D" strokeWidth="1.5" />
                    <path d="M18 3L32 10.5L18 18L4 10.5L18 3Z" fill="#E8A33D" fillOpacity="0.85" />
                    <path d="M18 18V33L32 25.5V10.5L18 18Z" fill="#132E3E" />
                    <path d="M18 18V33L4 25.5V10.5L18 18Z" fill="#0B1F2A" />
                  </svg>
                </div>
                <div className={styles.brandText}>
                  <span className={styles.brandTitle}>SentraOps</span>
                </div>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsMobileOpen(false)}
                aria-label="Close menu"
              >
                &times;
              </button>
            </div>

            <nav className={styles.mobileNavList}>
              <a href="#features" className={styles.mobileNavLink} onClick={() => setIsMobileOpen(false)}>
                Features
              </a>
              <a href="#how-it-works" className={styles.mobileNavLink} onClick={() => setIsMobileOpen(false)}>
                How It Works
              </a>
              <a href="#pricing" className={styles.mobileNavLink} onClick={() => setIsMobileOpen(false)}>
                Pricing
              </a>
              <Link to="/platform" className={styles.mobileNavLink} onClick={() => setIsMobileOpen(false)}>
                Documentation
              </Link>
              <Link to="/services" className={styles.mobileNavLink} onClick={() => setIsMobileOpen(false)}>
                Services
              </Link>
              <Link to="/incidents" className={styles.mobileNavLink} onClick={() => setIsMobileOpen(false)}>
                Incidents
              </Link>
              <Link to="/maintenance" className={styles.mobileNavLink} onClick={() => setIsMobileOpen(false)}>
                Maintenance
              </Link>
              <Link to="/analytics" className={styles.mobileNavLink} onClick={() => setIsMobileOpen(false)}>
                Analytics
              </Link>
              <Link to="/about" className={styles.mobileNavLink} onClick={() => setIsMobileOpen(false)}>
                About
              </Link>
              <Link to="/contact" className={styles.mobileNavLink} onClick={() => setIsMobileOpen(false)}>
                Contact
              </Link>
              <Link to="/status/acme-corp" className={styles.mobileNavLink} onClick={() => setIsMobileOpen(false)}>
                Status
              </Link>
            </nav>

            <div className={styles.mobileAuthActions}>
              <Link to="/login" className={styles.mobileLoginBtn} onClick={() => setIsMobileOpen(false)}>
                Log In
              </Link>
              <Link to="/register" className={styles.mobileTrialBtn} onClick={() => setIsMobileOpen(false)}>
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
