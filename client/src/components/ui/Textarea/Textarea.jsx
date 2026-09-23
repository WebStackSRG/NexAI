import { forwardRef, useId, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';
import styles from './Textarea.module.scss';

export const Textarea = forwardRef(function Textarea(
  { label, hint, error, autoResize = false, id, className, disabled, rows = 3, onChange, ...props },
  ref,
) {
  const generatedId = useId();
  const textareaId = id || generatedId;
  const hintId = hint ? `${textareaId}-hint` : undefined;
  const errorId = error ? `${textareaId}-error` : undefined;
  const internalRef = useRef(null);

  const combinedRef = (element) => {
    internalRef.current = element;
    if (typeof ref === 'function') {
      ref(element);
    } else if (ref) {
      ref.current = element;
    }
  };

  const adjustHeight = useCallback(() => {
    if (autoResize && internalRef.current) {
      internalRef.current.style.height = 'auto';
      internalRef.current.style.height = `${internalRef.current.scrollHeight}px`;
    }
  }, [autoResize]);

  useEffect(() => {
    adjustHeight();
  }, [props.value, adjustHeight]);

  const handleChange = (e) => {
    adjustHeight();
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div className={cn(styles.wrapper, className)}>
      {label && (
        <label htmlFor={textareaId} className={styles.label}>
          {label}
        </label>
      )}
      <textarea
        ref={combinedRef}
        id={textareaId}
        rows={rows}
        disabled={disabled}
        onChange={handleChange}
        className={cn(styles.textarea, error && styles.hasError)}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId || hintId}
        {...props}
      />
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

Textarea.displayName = 'Textarea';
