import styles from './BreadcrumbsPanel.module.css';

export interface BreadcrumbItem {
  category: string;
  message: string;
  level?: string;
  timestamp: string;
  data?: Record<string, any>;
}

export interface BreadcrumbsPanelProps {
  breadcrumbs?: BreadcrumbItem[];
}

export function BreadcrumbsPanel({ breadcrumbs = [] }: BreadcrumbsPanelProps) {
  return (
    <div className={styles.container}>
      <div className={styles.panelTitle}>Breadcrumbs ({breadcrumbs.length})</div>

      {breadcrumbs.length === 0 ? (
        <div className={styles.empty}>No breadcrumbs recorded before this error.</div>
      ) : (
        <ul className={styles.list}>
          {breadcrumbs.map((b, idx) => {
            const catClass = styles[`category_${b.category}`] || '';
            return (
              <li key={idx} className={styles.item}>
                <span className={`${styles.categoryBadge} ${catClass}`}>
                  {b.category}
                </span>
                <span className={styles.message}>{b.message}</span>
                <span className={styles.timestamp}>
                  {new Date(b.timestamp).toLocaleTimeString()}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default BreadcrumbsPanel;
