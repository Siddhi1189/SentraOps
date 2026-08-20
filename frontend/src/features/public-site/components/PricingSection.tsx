import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './PricingSection.module.css';

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className={styles.section}>
      <div className={styles.container}>
        {/* Eyebrow and Heading */}
        <div className={styles.header}>
          <div className={styles.eyebrow}>PLANS</div>
          <h2 className={styles.heading}>Choose Your Best Fit</h2>

          {/* Billing Cycle Toggle */}
          <div className={styles.toggleContainer}>
            <button
              type="button"
              className={`${styles.toggleBtn} ${!isYearly ? styles.toggleBtnActive : ''}`}
              onClick={() => setIsYearly(false)}
            >
              <span className={styles.toggleDot} />
              <span>Monthly</span>
            </button>
            <button
              type="button"
              className={`${styles.toggleBtn} ${isYearly ? styles.toggleBtnActive : ''}`}
              onClick={() => setIsYearly(true)}
            >
              <span>Yearly (Save 20%)</span>
            </button>
          </div>
        </div>

        {/* 3 Pricing Cards */}
        <div className={styles.pricingGrid}>
          {/* 1. Starter */}
          <div className={styles.priceCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.planName}>Starter</h3>
              <p className={styles.planTarget}>For individuals &amp; small teams</p>
              <div className={styles.priceWrap}>
                <span className={styles.currency}>₹</span>
                <span className={styles.priceAmount}>{isYearly ? '399' : '499'}</span>
                <span className={styles.period}>/month</span>
              </div>
            </div>

            <ul className={styles.featureList}>
              <li className={styles.featureItem}>
                <svg className={styles.checkIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B1F2A" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Up to 5 Services</span>
              </li>
              <li className={styles.featureItem}>
                <svg className={styles.checkIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B1F2A" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Core Monitoring Features</span>
              </li>
              <li className={styles.featureItem}>
                <svg className={styles.checkIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B1F2A" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Email Notifications</span>
              </li>
              <li className={styles.featureItem}>
                <svg className={styles.checkIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B1F2A" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Community Support</span>
              </li>
            </ul>

            <Link to="/register" className={styles.outlineCta}>
              Get Started
            </Link>
          </div>

          {/* 2. Team (Highlighted / Most Popular) */}
          <div className={`${styles.priceCard} ${styles.popularCard}`}>
            <div className={styles.popularBadge}>MOST POPULAR</div>

            <div className={styles.cardHeader}>
              <h3 className={styles.planName}>Team</h3>
              <p className={styles.planTarget}>For growing engineering teams</p>
              <div className={styles.priceWrap}>
                <span className={styles.currency}>₹</span>
                <span className={styles.priceAmount}>{isYearly ? '799' : '999'}</span>
                <span className={styles.period}>/month</span>
              </div>
            </div>

            <ul className={styles.featureList}>
              <li className={styles.featureItem}>
                <svg className={styles.checkIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B1F2A" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Up to 50 Services</span>
              </li>
              <li className={styles.featureItem}>
                <svg className={styles.checkIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B1F2A" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Advanced Monitoring</span>
              </li>
              <li className={styles.featureItem}>
                <svg className={styles.checkIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B1F2A" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Escalations &amp; Policies</span>
              </li>
              <li className={styles.featureItem}>
                <svg className={styles.checkIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B1F2A" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Analytics &amp; Dashboards</span>
              </li>
              <li className={styles.featureItem}>
                <svg className={styles.checkIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B1F2A" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Priority Email Support</span>
              </li>
            </ul>

            <Link to="/register" className={styles.solidCta}>
              Start 14-Day Free Trial
            </Link>
          </div>

          {/* 3. Business */}
          <div className={styles.priceCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.planName}>Business</h3>
              <p className={styles.planTarget}>For large teams &amp; orgs</p>
              <div className={styles.priceWrap}>
                <span className={styles.currency}>₹</span>
                <span className={styles.priceAmount}>{isYearly ? '1,599' : '1,999'}</span>
                <span className={styles.period}>/month</span>
              </div>
            </div>

            <ul className={styles.featureList}>
              <li className={styles.featureItem}>
                <svg className={styles.checkIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B1F2A" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Unlimited Services</span>
              </li>
              <li className={styles.featureItem}>
                <svg className={styles.checkIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B1F2A" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>SLA Monitoring</span>
              </li>
              <li className={styles.featureItem}>
                <svg className={styles.checkIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B1F2A" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Custom Status Pages</span>
              </li>
              <li className={styles.featureItem}>
                <svg className={styles.checkIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B1F2A" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>SSO &amp; Audit Logs</span>
              </li>
              <li className={styles.featureItem}>
                <svg className={styles.checkIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0B1F2A" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Dedicated Support</span>
              </li>
            </ul>

            <Link to="/contact" className={styles.outlineCta}>
              Contact Sales
            </Link>
          </div>
        </div>

        {/* Reassurance Footer Badge */}
        <div className={styles.trustBadgeRow}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8A33D" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          <span>
            <strong>Your data is safe.</strong> Encrypted backups, secure infrastructure and strict access controls.
          </span>
        </div>
      </div>
    </section>
  );
}
