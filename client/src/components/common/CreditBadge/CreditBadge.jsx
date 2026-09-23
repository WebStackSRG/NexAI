import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import styles from './CreditBadge.module.scss';

export function CreditBadge({ credits = 100, onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(styles.badge, className)}
      title="Credits remaining. Click to recharge."
      aria-label={`${credits} credits remaining. Click to recharge.`}
    >
      <Zap size={14} fill="currentColor" />
      <span>{credits} credits</span>
    </button>
  );
}
