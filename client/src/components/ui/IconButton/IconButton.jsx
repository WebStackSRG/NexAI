import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';
import styles from './IconButton.module.scss';

export const IconButton = forwardRef(function IconButton(
  { icon, label, size = 'md', variant = 'ghost', className, disabled, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(styles.iconButton, styles[size], styles[variant], className)}
      aria-label={label}
      title={label}
      disabled={disabled}
      {...props}
    >
      {icon}
    </button>
  );
});

IconButton.displayName = 'IconButton';
