import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './PublicFooter.module.css';

export function PublicFooter() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setIsSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.topGrid}>
          {/* Brand & Socials Column */}
          <div className={styles.brandCol}>
            <Link to="/" className={styles.logoLink} aria-label="SentraOps Home">
              <svg className={styles.logoSvg} viewBox="0 0 36 36" fill="none">
                <path d="M18 3L32 10.5V25.5L18 33L4 25.5V10.5L18 3Z" fill="#0B1F2A" stroke="#E8A33D" strokeWidth="1.5" />
                <path d="M18 3L32 10.5L18 18L4 10.5L18 3Z" fill="#E8A33D" fillOpacity="0.85" />
                <path d="M18 18V33L32 25.5V10.5L18 18Z" fill="#132E3E" />
                <path d="M18 18V33L4 25.5V10.5L18 18Z" fill="#0B1F2A" />
              </svg>
              <span className={styles.logoText}>SentraOps</span>
            </Link>

            <p className={styles.tagline}>
              Engineering Operations Monitoring &amp; Incident Management Platform
            </p>

            {/* Social Icons Row */}
            <div className={styles.socialRow}>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="LinkedIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.2a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28z" />
                </svg>
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="GitHub">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
                </svg>
              </a>
              <a href="https://gitlab.com" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="GitLab">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 5.5 2a.43.43 0 0 1 .4.27l2.45 7.55h7.3l2.45-7.55A.43.43 0 0 1 18.5 2a.42.42 0 0 1 .39.26l2.44 7.51 1.22 3.78a.84.84 0 0 1-.3.94z" />
                </svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="YouTube">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.58 7.19a2.5 2.5 0 0 0-1.76-1.77C18.26 5 12 5 12 5s-6.26 0-7.82.42A2.5 2.5 0 0 0 2.42 7.2 26.3 26.3 0 0 0 2 12a26.3 26.3 0 0 0 .42 4.81 2.5 2.5 0 0 0 1.76 1.77C5.74 19 12 19 12 19s6.26 0 7.82-.42a2.5 2.5 0 0 0 1.76-1.77A26.3 26.3 0 0 0 22 12a26.3 26.3 0 0 0-.42-4.81zM9.75 15.02V8.98L15 12l-5.25 3.02z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div className={styles.linksCol}>
            <span className={styles.colHeading}>PRODUCT</span>
            <ul className={styles.linksList}>
              <li><Link to="/platform" className={styles.link}>Overview</Link></li>
              <li><a href="#features" className={styles.link}>Features</a></li>
              <li><a href="#how-it-works" className={styles.link}>How It Works</a></li>
              <li><a href="#pricing" className={styles.link}>Pricing</a></li>
              <li><Link to="/status/acme-corp" className={styles.link}>Status Page</Link></li>
            </ul>
          </div>

          {/* Resources Links */}
          <div className={styles.linksCol}>
            <span className={styles.colHeading}>RESOURCES</span>
            <ul className={styles.linksList}>
              <li><Link to="/platform" className={styles.link}>Documentation</Link></li>
              <li><Link to="/platform" className={styles.link}>API Reference</Link></li>
              <li><Link to="/about" className={styles.link}>Guides</Link></li>
              <li><Link to="/platform" className={styles.link}>Changelog</Link></li>
              <li><Link to="/about" className={styles.link}>Blog</Link></li>
            </ul>
          </div>

          {/* Company Links */}
          <div className={styles.linksCol}>
            <span className={styles.colHeading}>COMPANY</span>
            <ul className={styles.linksList}>
              <li><Link to="/about" className={styles.link}>About Us</Link></li>
              <li><Link to="/about" className={styles.link}>Careers</Link></li>
              <li><Link to="/contact" className={styles.link}>Partner With Us</Link></li>
              <li><Link to="/contact" className={styles.link}>Contact Us</Link></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className={styles.linksCol}>
            <span className={styles.colHeading}>LEGAL</span>
            <ul className={styles.linksList}>
              <li><Link to="/about" className={styles.link}>Terms of Service</Link></li>
              <li><Link to="/about" className={styles.link}>Privacy Policy</Link></li>
              <li><Link to="/platform" className={styles.link}>Security</Link></li>
              <li><Link to="/about" className={styles.link}>Data Processing</Link></li>
            </ul>
          </div>

          {/* Stay Updated / Newsletter */}
          <div className={styles.newsletterCol}>
            <span className={styles.colHeading}>STAY UPDATED</span>
            <p className={styles.newsletterDesc}>Get product updates and platform tips.</p>

            <form onSubmit={handleSubmit} className={styles.newsletterForm}>
              <input
                type="email"
                className={styles.emailInput}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className={styles.subscribeBtn}>
                {isSubscribed ? 'Subscribed!' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <p className={styles.copyright}>&copy; 2025 SentraOps. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
