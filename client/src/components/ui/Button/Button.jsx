import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';
import styles from './Button.module.scss';

export const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    as: Component = 'button',
    className,
    disabled,
    ...props
  },
  ref,
) {
  const isButton = Component === 'button';

  return (
    <Component
      ref={ref}
      className={cn(
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        loading && styles.loading,
        className,
      )}
      disabled={isButton ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      aria-disabled={disabled || loading ? true : undefined}
      {...props}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {!loading && leftIcon && <span className={styles.icon}>{leftIcon}</span>}
      <span>{children}</span>
      {!loading && rightIcon && <span className={styles.icon}>{rightIcon}</span>}
    </Component>
  );
});

Button.displayName = 'Button';
