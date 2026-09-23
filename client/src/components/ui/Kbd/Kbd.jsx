import { cn } from '@/lib/utils/cn';
import styles from './Kbd.module.scss';

export function Kbd({ children, className, ...props }) {
  return (
    <kbd className={cn(styles.kbd, className)} {...props}>
      {children}
    </kbd>
  );
}
