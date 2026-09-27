import { Card } from '@/components/ui/Card';
import styles from './StatCard.module.scss';

export function StatCard({ title, value, subtitle, icon, tone = 'default' }) {
  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <div className={`${styles.iconWrap} ${styles[tone]}`}>{icon}</div>
      </div>
      <div className={styles.body}>
        <div className={styles.value}>{value}</div>
        {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
      </div>
    </Card>
  );
}
