import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import styles from './Tag.module.scss';

export function Tag({ label, removable = false, onRemove, className, ...props }) {
  return (
    <span className={cn(styles.tag, className)} {...props}>
      <span>{label}</span>
      {removable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className={styles.removeButton}
          aria-label={`Remove tag ${label}`}
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
}
