import styles from './Toast.module.css';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const typeClass =
    toast.type === 'success'
      ? styles.toastSuccess
      : toast.type === 'warning'
      ? styles.toastWarning
      : toast.type === 'error'
      ? styles.toastError
      : styles.toastInfo;

  return (
    <div className={`${styles.toast} ${typeClass}`} role="alert">
      <span>{toast.message}</span>
      <button
        className={styles.closeButton}
        onClick={() => onDismiss(toast.id)}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
}
