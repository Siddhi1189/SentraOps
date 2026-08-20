import type React from 'react';
import styles from './Tabs.module.css';

export interface TabItem {
  id: string;
  label: string;
  content?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ items, activeTab, onTabChange, className }: TabsProps) {
  const activeItem = items.find((item) => item.id === activeTab) || items[0];

  return (
    <div className={`${styles.tabContainer} ${className || ''}`}>
      <div className={styles.tabList} role="tablist" aria-label="Tabs navigation">
        {items.map((item) => {
          const isActive = item.id === activeTab;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-controls={`panel-${item.id}`}
              aria-selected={isActive}
              disabled={item.disabled}
              className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
              onClick={() => onTabChange(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {activeItem && (
        <div
          id={`panel-${activeItem.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeItem.id}`}
          className={styles.tabPanel}
          tabIndex={0}
        >
          {activeItem.content}
        </div>
      )}
    </div>
  );
}
