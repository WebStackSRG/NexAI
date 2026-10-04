import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils/cn';
import styles from './Input.module.scss';

export const Input = forwardRef(function Input(
  {
    label,
    hint,
    error,
    leftIcon,
    prefix,
    rightIcon,
    suffix,
    size = 'md',
    id,
    className,
    disabled,
    type = 'text',
    autoComplete = 'off',
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const leadingIcon = leftIcon || prefix;
  const trailingIcon = rightIcon || suffix;

  return (
    <div className={cn(styles.wrapper, className)}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <div
        className={cn(
          styles.inputContainer,
          styles[`size_${size}`],
          error && styles.hasError,
          disabled && styles.disabled,
        )}
      >
        {leadingIcon && <span className={styles.leftIcon}>{leadingIcon}</span>}
        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          autoComplete={autoComplete}
          className={styles.input}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId || hintId}
          {...props}
        />
        {trailingIcon && <span className={styles.rightIcon}>{trailingIcon}</span>}
      </div>
      {error && (
        <span id={errorId} className={styles.error} role="alert">
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={hintId} className={styles.hint}>
          {hint}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
