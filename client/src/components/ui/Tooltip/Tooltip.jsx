import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import styles from './Tooltip.module.scss';

export function Tooltip({ children, content, side = 'top', className }) {
  const [visible, setVisible] = useState(false);

  if (!content) return children;

  return (
    <div
      className={cn(styles.wrapper, className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className={cn(styles.tooltip, styles[side])} role="tooltip">
          {content}
        </div>
      )}
    </div>
  );
}
