import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import styles from './CreditBadge.module.scss';

/**
 * CreditBadge component - Displays remaining AI credits with quick-recharge navigation
 * Specified in docs/BUILD_GUIDE.md under features/wallet
 *
 * @param {object} props
 * @param {number} [props.credits=100] - Credits balance
 * @param {() => void} [props.onClick] - Optional click handler (e.g. navigate to /wallet)
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - Visual size variant
 * @param {boolean} [props.showIcon=true] - Whether to show the lightning Zap icon
 * @param {string} [props.className] - Additional CSS class
 */
export function CreditBadge({
  credits = 100,
  onClick,
  size = 'md',
  showIcon = true,
  className,
}) {
  const isLow = credits <= 20;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        styles.badge,
        styles[size],
        isLow && styles.low,
        className,
      )}
      title={`${credits} credits remaining. Click to recharge.`}
      aria-label={`${credits} credits remaining. Click to recharge.`}
    >
      {showIcon && (
        <Zap
          size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14}
          fill="currentColor"
          className={styles.icon}
        />
      )}
      <span className={styles.label}>
        <strong className={styles.value}>{credits.toLocaleString()}</strong>
        <span className={styles.unit}> credits</span>
      </span>
    </button>
  );
}

export default CreditBadge;
