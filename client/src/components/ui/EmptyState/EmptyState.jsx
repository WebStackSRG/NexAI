import { cn } from '@/lib/utils/cn';
import styles from './EmptyState.module.scss';

export function EmptyState({ icon, title, description, action, className }) {
  return (
    <div className={cn(styles.container, className)}>
      {icon && <div className={styles.iconWrapper}>{icon}</div>}
      {title && <h3 className={styles.title}>{title}</h3>}
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
