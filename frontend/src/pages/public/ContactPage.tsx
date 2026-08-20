import { useState } from 'react';
import type React from 'react';
import { PublicNavbar } from '../../features/public-site/components/PublicNavbar';
import { PageHeaderHero } from '../../features/public-site/components/PageHeaderHero';
import { PublicFooter } from '../../features/public-site/components/PublicFooter';
import styles from './ContactPage.module.css';

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Platform Architecture Inquiry',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className={styles.pageWrapper}>
      <PublicNavbar />
      <main className={styles.mainContent}>
        <PageHeaderHero
          variant="white"
          eyebrow="CONTACT OPERATIONS &amp; INQUIRIES"
          title="Connect directly with our reliability engineering team."
          subtitle="Whether you have questions regarding deployment topologies, optimistic concurrency guarantees, or enterprise onboarding, we are here to assist."
        />

        <section className={styles.contactSection}>
          <div className={styles.contactContainer}>
            {/* Left Column: Direct Inquiries */}
            <div className={styles.leftCol}>
              <div>
                <div className={styles.eyebrow}>
                  <span className={styles.eyebrowDot} />
                  <span>DIRECT CHANNELS</span>
                </div>
                <h2 className={styles.sectionHeading}>
                  Direct engineer-to-engineer communication.
                </h2>
                <p className={styles.sectionDescription}>
                  Our reliability engineering team monitors incoming technical inquiries continuously. For existing organizations, you can also trigger support tickets directly inside the operator console.
                </p>
              </div>

              <div className={styles.channelCards}>
                <div className={styles.channelCard}>
                  <div className={styles.channelTag}>
                    OPERATIONS &amp; ARCHITECTURE
                  </div>
                  <div className={styles.channelEmail}>
                    ops@sentraops.internal
                  </div>
                  <div className={styles.channelSla}>
                    Target Response SLA: &lt; 2 business hours
                  </div>
                </div>

                <div className={styles.channelCard}>
                  <div className={styles.channelTag}>
                    SECURITY &amp; COMPLIANCE
                  </div>
                  <div className={styles.channelEmail}>
                    security@sentraops.internal
                  </div>
                  <div className={styles.channelSla}>
                    PGP Key Fingerprint available upon request
                  </div>
                </div>
              </div>

              <div className={styles.promoCard}>
                <div className={styles.promoTitle}>
                  Ready to test the platform?
                </div>
                <p className={styles.promoText}>
                  Create an organization in seconds to test real-time health checks, incident workflows, and public status pages.
                </p>
                <a
                  href="/register"
                  className={styles.promoBtn}
                >
                  Create Free Organization &rarr;
                </a>
              </div>
            </div>

            {/* Right Column: Structured Inquiry Form */}
            <div className={styles.formCard}>
              <h3 className={styles.formTitle}>
                Direct Operational Inquiry
              </h3>
              <p className={styles.formSubtitle}>
                Fill out the technical brief below and our on-duty reliability engineer will review your inquiry.
              </p>

              {submitted ? (
                <div className={styles.successNotice}>
                  <div className={styles.successNoticeTitle}>
                    ✓ Inquiry Dispatched Successfully
                  </div>
                  <p className={styles.successNoticeText}>
                    Our operations engineering team has received your brief and will respond to <strong>{formData.email}</strong> shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className={styles.form}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="contact-name" className={styles.label}>
                      Full Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      placeholder="e.g. Alex Morgan"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="contact-email" className={styles.label}>
                      Work Email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      placeholder="alex@company.internal"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="contact-subject" className={styles.label}>
                      Subject
                    </label>
                    <select
                      id="contact-subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className={styles.select}
                    >
                      <option value="Platform Architecture Inquiry">Platform Architecture Inquiry</option>
                      <option value="OCC & Escalation Integration">OCC &amp; Escalation Integration</option>
                      <option value="Dedicated Deployment Topology">Dedicated Deployment Topology</option>
                      <option value="General Reliability Support">General Reliability Support</option>
                    </select>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="contact-message" className={styles.label}>
                      Technical Inquiry / Architecture Requirements
                    </label>
                    <textarea
                      id="contact-message"
                      required
                      rows={4}
                      placeholder="Describe your current deployment environment, service count, or question..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className={styles.textarea}
                    />
                  </div>

                  <button
                    type="submit"
                    className={styles.submitBtn}
                  >
                    Submit Technical Brief &rarr;
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
