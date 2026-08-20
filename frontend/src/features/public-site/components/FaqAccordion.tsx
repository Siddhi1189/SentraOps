import { useState } from 'react';
import styles from './FaqAccordion.module.css';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'What does SentraOps monitor?',
    answer:
      'SentraOps monitors HTTP/HTTPS services, REST APIs, microservices, SSL certificates, latency metrics, response codes, and infrastructure dependencies with sub-second probes.',
  },
  {
    question: 'How does incident detection work?',
    answer:
      'When health checks fail consecutive thresholds or response times spike, SentraOps automatically generates incidents, determines severity, alerts responders, and tracks lifecycle through resolution.',
  },
  {
    question: 'Can I create maintenance windows?',
    answer:
      'Yes! You can schedule one-time or recurring maintenance windows that automatically suppress alarm notifications and inform your users ahead of time via status pages.',
  },
  {
    question: 'Does it support escalation policies?',
    answer:
      'Yes, configure multi-tier escalation policies with custom delay intervals, alerting primary responders first, then escalating to backups or team leads.',
  },
  {
    question: 'Is my data secure and private?',
    answer:
      'SentraOps uses bank-grade encryption at rest and in transit, optimistic concurrency control to prevent split-brain edits, immutable audit logs, and strict RBAC controls.',
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.cardHeading}>Frequently Asked Questions</h3>

      <div className={styles.faqList}>
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className={styles.faqItem}>
              <button
                type="button"
                className={styles.questionBtn}
                onClick={() => toggleItem(idx)}
                aria-expanded={isOpen}
              >
                <span className={styles.questionText}>{faq.question}</span>
                <svg
                  className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {isOpen && (
                <div className={styles.answerContainer}>
                  <p className={styles.answerText}>{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
