import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils/cn';
import styles from './Input.module.scss';

export const Input = forwardRef(function Input(
  { label, hint, error, leftIcon, id, className, disabled, type = 'text', ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={cn(styles.wrapper, className)}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <div
        className={cn(styles.inputContainer, error && styles.hasError, disabled && styles.disabled)}
      >
        {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          className={styles.input}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId || hintId}
          {...props}
        />
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
