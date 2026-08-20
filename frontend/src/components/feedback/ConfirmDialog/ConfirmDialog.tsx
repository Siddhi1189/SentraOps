import { useRef } from 'react';
import { Modal } from '../../ui/Modal/Modal';
import { Button } from '../../ui/Button/Button';
import { Spinner } from '../../ui/Spinner/Spinner';
import styles from './ConfirmDialog.module.css';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const footer = (
    <>
      <Button
        ref={cancelButtonRef}
        type="button"
        variant="secondary"
        onClick={onClose}
        disabled={isLoading}
      >
        {cancelLabel}
      </Button>
      <Button
        type="button"
        variant={variant === 'danger' ? 'danger' : 'primary'}
        onClick={onConfirm}
        disabled={isLoading}
      >
        {isLoading ? <Spinner size="sm" /> : confirmLabel}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={footer}
      initialFocusRef={cancelButtonRef}
    >
      <div className={styles.content}>
        <p className={styles.message}>{message}</p>
      </div>
    </Modal>
  );
}
