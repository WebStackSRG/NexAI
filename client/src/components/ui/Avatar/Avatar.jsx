import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import styles from './Avatar.module.scss';

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ src, name = 'User', size = 'md', className, ...props }) {
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className={cn(styles.avatar, styles[size], className)}
      role="img"
      aria-label={name}
      {...props}
    >
      {src && !hasError ? (
        <img src={src} alt={name} onError={() => setHasError(true)} />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}
