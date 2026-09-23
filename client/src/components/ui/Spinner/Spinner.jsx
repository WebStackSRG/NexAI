import { cn } from '@/lib/utils/cn';
import styles from './Spinner.module.scss';

export function Spinner({ size = 'md', className, ...props }) {
  return (
    <span
      className={cn(styles.spinner, styles[size], className)}
      role="status"
      aria-label="Loading"
      {...props}
    />
  );
}
