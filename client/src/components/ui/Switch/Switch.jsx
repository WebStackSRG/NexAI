import { cn } from '@/lib/utils/cn';
import styles from './Switch.module.scss';

export function Switch({ checked = false, onChange, label, disabled = false, id, className }) {
  const toggle = () => {
    if (!disabled) {
      onChange?.(!checked);
    }
  };

  return (
    <label
      htmlFor={id}
      className={cn(styles.wrapper, disabled && styles.disabled, className)}
      onClick={(e) => {
        e.preventDefault();
        toggle();
      }}
    >
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label || 'Toggle switch'}
        disabled={disabled}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            toggle();
          }
        }}
        className={cn(styles.switch, checked && styles.checked)}
      >
        <span className={cn(styles.thumb, checked && styles.checked)} />
      </button>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
}
