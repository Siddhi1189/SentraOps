import styles from './Spinner.module.css';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClass = styles[size] || styles.md;
  return (
    <div
      className={`${styles.spinner} ${sizeClass} ${className || ''}`}
      role="status"
      aria-label="Loading"
    />
  );
}
