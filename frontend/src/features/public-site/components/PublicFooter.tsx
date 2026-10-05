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
          </div>

          {/* Product Links */}
          <div className={styles.linksCol}>
            <span className={styles.colHeading}>PRODUCT</span>
            <ul className={styles.linksList}>
              <li><Link to="/docs" className={styles.link}>Overview</Link></li>
              <li><Link to="/#features" className={styles.link}>Features</Link></li>
              <li><Link to="/#how-it-works" className={styles.link}>How It Works</Link></li>
              <li><Link to="/status/acme-corp" className={styles.link}>Status Page</Link></li>
            </ul>
          </div>

          {/* Resources Links */}
          <div className={styles.linksCol}>
            <span className={styles.colHeading}>RESOURCES</span>
            <ul className={styles.linksList}>
              <li><Link to="/docs" className={styles.link}>Documentation</Link></li>
              <li><Link to="/docs" className={styles.link}>API Reference</Link></li>
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
