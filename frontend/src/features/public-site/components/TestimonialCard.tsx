import { useState } from 'react';
import styles from './TestimonialCard.module.css';

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  avatar: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'SentraOps has reduced our incident resolution time by 60%. The real-time alerts and auto recovery are a game changer!',
    name: 'Arjun Mehta',
    role: 'SRE Lead, FinEdge',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces',
  },
  {
    quote:
      'The optimistic concurrency control eliminated all the conflicting updates our engineers were experiencing during critical outages.',
    name: 'Sarah Chen',
    role: 'Head of Infrastructure, CloudScale',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces',
  },
  {
    quote:
      'Setting up maintenance windows with automated alert suppression saved our on-call team from countless false alarms.',
    name: 'David Rodriguez',
    role: 'VP of Engineering, PayFlow',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces',
  },
];

export function TestimonialCard() {
  const [activeIndex, setActiveIndex] = useState(0);
  const current = TESTIMONIALS[activeIndex];

  return (
    <div className={styles.card}>
      <h3 className={styles.cardHeading}>What Our Users Say</h3>

      <div className={styles.quoteMark}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#0B1F2A">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
      </div>

      <p className={styles.quoteText}>{current.quote}</p>

      <div className={styles.authorRow}>
        <img src={current.avatar} alt={current.name} className={styles.avatar} />
        <div className={styles.authorInfo}>
          <div className={styles.authorName}>{current.name}</div>
          <div className={styles.authorRole}>{current.role}</div>
        </div>
      </div>

      {/* Pagination Carousel Dots */}
      <div className={styles.dotsRow}>
        {TESTIMONIALS.map((_, idx) => (
          <button
            key={idx}
            type="button"
            className={`${styles.dot} ${idx === activeIndex ? styles.dotActive : ''}`}
            onClick={() => setActiveIndex(idx)}
            aria-label={`Go to testimonial ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
