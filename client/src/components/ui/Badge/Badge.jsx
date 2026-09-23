import { cn } from '@/lib/utils/cn';
import styles from './Badge.module.scss';

export function Badge({ children, tone = 'neutral', className, ...props }) {
  return (
    <span className={cn(styles.badge, styles[tone], className)} {...props}>
      {children}
    </span>
  );
}
