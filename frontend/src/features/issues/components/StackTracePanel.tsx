import styles from './StackTracePanel.module.css';

export interface StackTracePanelProps {
  stack?: string | null;
}

export function StackTracePanel({ stack }: StackTracePanelProps) {
  if (!stack || stack.trim() === '') {
    return (
      <div className={styles.stackContainer}>
        <div className={styles.stackHeader}>
          <span>Stack Trace</span>
        </div>
        <div className={styles.emptyStack}>No stack trace available for this event.</div>
      </div>
    );
  }

  return (
    <div className={styles.stackContainer}>
      <div className={styles.stackHeader}>
        <span>Stack Trace</span>
      </div>
      <pre className={styles.stackContent}>{stack}</pre>
    </div>
  );
}

export default StackTracePanel;
