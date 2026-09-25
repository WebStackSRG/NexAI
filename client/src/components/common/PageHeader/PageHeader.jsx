import { cn } from '@/lib/utils/cn';
import styles from './PageHeader.module.scss';

export function PageHeader({ title, description, actions, className }) {
  return (
    <header className={cn(styles.header, className)}>
      <div className={styles.textGroup}>
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
