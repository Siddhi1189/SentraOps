import { useState, useRef, useEffect } from 'react';
import styles from './TableActionsMenu.module.css';

export interface ActionMenuItem {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

export interface TableActionsMenuProps {
  label?: string;
  items: ActionMenuItem[];
}

export function TableActionsMenu({ label = 'Row actions', items }: TableActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const activeItems = items.filter(Boolean);
  if (activeItems.length === 0) return null;

  return (
    <div
      className={styles.container}
      ref={containerRef}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className={styles.triggerButton}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <span aria-hidden="true" className={styles.ellipsisIcon}>⋯</span>
      </button>

      {isOpen && (
        <div className={styles.menu} role="menu" aria-label={label}>
          {activeItems.map((item, index) => (
            <button
              key={index}
              type="button"
              role="menuitem"
              className={`${styles.menuItem} ${item.variant === 'danger' ? styles.dangerItem : ''}`}
              disabled={item.disabled}
              onClick={() => {
                setIsOpen(false);
                item.onClick();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
