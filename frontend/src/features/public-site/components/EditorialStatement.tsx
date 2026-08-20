import styles from './EditorialStatement.module.css';

export function EditorialStatement() {
  const checkItems = [
    'Real-time monitoring of HTTP services and dependencies',
    'Automatic incident detection and recovery',
    'Escalations, on-call rotations and policy-driven alerts',
    'Role-based access control for your team',
    'Everything in one place. Save time and reduce toil.',
  ];

  return (
    <section id="how-it-works" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.cardContainer}>
          {/* Left Column: Custom Vector SVG Illustration */}
          <div className={styles.illustrationCol}>
            <div className={styles.illustrationWrap}>
              <svg
                className={styles.svgScene}
                viewBox="0 0 420 340"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Background Soft Glow */}
                <ellipse cx="210" cy="190" rx="160" ry="110" fill="#F4E9D8" fillOpacity="0.7" />

                {/* Floating Chips Behind/Around */}
                {/* 1. Bar Chart Chip (Top Left) */}
                <g className={styles.floatingChip1}>
                  <rect x="35" y="45" width="80" height="65" rx="10" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" filter="drop-shadow(0 8px 16px rgba(11,31,42,0.06))" />
                  <rect x="50" y="80" width="8" height="18" rx="2" fill="#E8A33D" />
                  <rect x="64" y="68" width="8" height="30" rx="2" fill="#0B1F2A" />
                  <rect x="78" y="74" width="8" height="24" rx="2" fill="#2563EB" />
                  <rect x="92" y="58" width="8" height="40" rx="2" fill="#16A34A" />
                </g>

                {/* 2. Notification Bell Chip (Top Center-Left) */}
                <g className={styles.floatingChip2}>
                  <rect x="155" y="20" width="55" height="55" rx="10" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" filter="drop-shadow(0 8px 16px rgba(11,31,42,0.06))" />
                  <path d="M182.5 35a4.5 4.5 0 0 0-4.5 4.5c0 5.25-2.25 6.75-2.25 6.75h13.5s-2.25-1.5-2.25-6.75a4.5 4.5 0 0 0-4.5-4.5z" fill="none" stroke="#0B1F2A" strokeWidth="1.8" />
                  <path d="M179.3 48.5a2.5 2.5 0 0 0 4.4 0" stroke="#0B1F2A" strokeWidth="1.8" />
                  <circle cx="192" cy="33" r="3.5" fill="#EF4444" />
                </g>

                {/* 3. Calendar Chip (Top Right) */}
                <g className={styles.floatingChip3}>
                  <rect x="295" y="35" width="70" height="60" rx="10" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" filter="drop-shadow(0 8px 16px rgba(11,31,42,0.06))" />
                  <rect x="307" y="47" width="46" height="36" rx="4" fill="none" stroke="#0B1F2A" strokeWidth="1.8" />
                  <line x1="307" y1="58" x2="353" y2="58" stroke="#E8A33D" strokeWidth="2" />
                  <line x1="318" y1="44" x2="318" y2="48" stroke="#0B1F2A" strokeWidth="2" strokeLinecap="round" />
                  <line x1="342" y1="44" x2="342" y2="48" stroke="#0B1F2A" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="320" cy="68" r="2" fill="#2563EB" />
                  <circle cx="330" cy="68" r="2" fill="#16A34A" />
                  <circle cx="340" cy="68" r="2" fill="#E8A33D" />
                </g>

                {/* 4. Task/List Chip (Bottom Left) */}
                <g className={styles.floatingChip4}>
                  <rect x="40" y="150" width="75" height="65" rx="10" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" filter="drop-shadow(0 8px 16px rgba(11,31,42,0.06))" />
                  <circle cx="56" cy="168" r="3" fill="#16A34A" />
                  <line x1="65" y1="168" x2="98" y2="168" stroke="#0B1F2A" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="56" cy="182" r="3" fill="#E8A33D" />
                  <line x1="65" y1="182" x2="95" y2="182" stroke="#0B1F2A" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="56" cy="196" r="3" fill="#2563EB" />
                  <line x1="65" y1="196" x2="90" y2="196" stroke="#0B1F2A" strokeWidth="2" strokeLinecap="round" />
                </g>

                {/* 5. Shield Chip (Bottom Right) */}
                <g className={styles.floatingChip5}>
                  <rect x="315" y="145" width="60" height="60" rx="10" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" filter="drop-shadow(0 8px 16px rgba(11,31,42,0.06))" />
                  <path d="M345 160l-12 5v10c0 7.5 5.5 14.5 12 16 6.5-1.5 12-8.5 12-16v-10l-12-5z" fill="none" stroke="#E8A33D" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M340 176l3.5 3.5 7.5-7.5" stroke="#0B1F2A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </g>

                {/* Engineer Character Silhouette */}
                {/* Hair */}
                <path d="M170 170c-5-25 15-45 42-45 28 0 45 20 40 45 0 0-10 12-25 12s-32-12-57-12z" fill="#0B1F2A" />
                <path d="M190 125c15-8 38-5 45 12 8 20 5 35-5 40-10 5-25-10-25-10s-15-8-15-42z" fill="#0B1F2A" />
                {/* Face & Neck */}
                <circle cx="215" cy="165" r="22" fill="#F8CBA6" />
                <path d="M210 185v15h14v-15" fill="#E8B590" />
                {/* Torso / Warm Golden Jacket */}
                <path d="M170 240c-15 30-25 70-25 70h140s-10-40-25-70l-20-25h-50l-20 25z" fill="#E8A33D" />
                <path d="M205 200l10 40 10-40h-20z" fill="#FFFFFF" />
                {/* Glasses */}
                <circle cx="208" cy="162" r="5.5" stroke="#0B1F2A" strokeWidth="1.5" fill="none" />
                <circle cx="222" cy="162" r="5.5" stroke="#0B1F2A" strokeWidth="1.5" fill="none" />
                <line x1="213.5" y1="162" x2="216.5" y2="162" stroke="#0B1F2A" strokeWidth="1.5" />

                {/* Laptop & Desk */}
                <path d="M120 310h200v10H120z" fill="#D5D0C6" />
                {/* Laptop open display */}
                <polygon points="190,305 270,305 285,250 215,250" fill="#0B1F2A" />
                <polygon points="195,302 265,302 278,255 220,255" fill="#1E3E50" />
                <circle cx="249" cy="278" r="3" fill="#E8A33D" />
              </svg>
            </div>
          </div>

          {/* Right Column: Why SentraOps Copy & Checklist */}
          <div className={styles.contentCol}>
            <h2 className={styles.heading}>Why SentraOps?</h2>
            <p className={styles.subheading}>Built for reliability. Designed for engineering teams.</p>

            <div className={styles.checklist}>
              {checkItems.map((item, idx) => (
                <div key={idx} className={styles.checkItem}>
                  <div className={styles.checkCircle}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E8A33D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className={styles.checkText}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
