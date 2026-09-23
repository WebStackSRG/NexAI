import { useRef } from 'react';
import { cn } from '@/lib/utils/cn';
import styles from './Tabs.module.scss';

export function Tabs({ items = [], value, onChange, className }) {
  const tabsRef = useRef([]);

  const handleKeyDown = (e, index) => {
    let nextIndex = null;
    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % items.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + items.length) % items.length;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      tabsRef.current[nextIndex]?.focus();
      onChange?.(items[nextIndex].id);
    }
  };

  return (
    <div className={cn(styles.tabList, className)} role="tablist">
      {items.map((item, index) => {
        const isActive = item.id === value;
        return (
          <button
            key={item.id}
            ref={(el) => (tabsRef.current[index] = el)}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange?.(item.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(styles.tab, isActive && styles.active)}
          >
            {item.icon && <span aria-hidden="true">{item.icon}</span>}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
