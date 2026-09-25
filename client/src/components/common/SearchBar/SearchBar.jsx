import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import styles from './SearchBar.module.scss';

export function SearchBar({
  value = '',
  onChange,
  onClear,
  placeholder = 'Search...',
  autoFocus = false,
  className,
  ...props
}) {
  return (
    <div className={cn(styles.searchBar, className)}>
      <Search size={16} className={styles.searchIcon} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={styles.input}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            if (onClear) onClear();
            else onChange?.('');
          }}
          className={styles.clearButton}
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
