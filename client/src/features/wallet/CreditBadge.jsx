import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useWalletStore } from '@/store/walletStore';
import styles from './CreditBadge.module.scss';

/**
 * CreditBadge component - Displays remaining AI credits and active governance mode
 * Specified in docs/PRD.md Section 8.G and ADR-027
 *
 * @param {object} props
 * @param {number} [props.credits=100] - Credits balance
 * @param {() => void} [props.onClick] - Optional click handler (e.g. navigate to /wallet)
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - Visual size variant
 * @param {boolean} [props.showIcon=true] - Whether to show the lightning Zap icon
 * @param {'quota_free' | 'credit_strict'} [props.mode] - Optional mode override
 * @param {number} [props.dailyRequestsRemaining] - Optional remaining quota calls override
 * @param {string} [props.className] - Additional CSS class
 */
export function CreditBadge({
  credits = 100,
  onClick,
  size = 'md',
  showIcon = true,
  mode,
  dailyRequestsRemaining,
  className,
}) {
  const storeGovernance = useWalletStore((state) => state.governance);
  const activeMode = mode || storeGovernance?.billingEnforcementMode || 'quota_free';
  const isQuotaMode = activeMode === 'quota_free';
  const remaining =
    dailyRequestsRemaining ?? storeGovernance?.dailyRequestsRemaining ?? 1500;
  const isLow = credits <= 20;

  const tooltip = isQuotaMode
    ? `⚡ Quota Mode: ${remaining.toLocaleString()} / 1,500 daily calls left (Simulated balance: ${credits} credits). Click to manage wallet.`
    : `${credits} credits remaining. Click to recharge.`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        styles.badge,
        styles[size],
        isQuotaMode && styles.quotaMode,
        isLow && styles.low,
        className,
      )}
      title={tooltip}
      aria-label={tooltip}
    >
      {showIcon && (
        <Zap
          size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14}
          fill="currentColor"
          className={styles.icon}
        />
      )}
      <span className={styles.label}>
        {isQuotaMode && <span className={styles.quotaPill}>Quota Mode:</span>}
        <strong className={styles.value}>{credits.toLocaleString()}</strong>
        <span className={styles.unit}> credits</span>
        {isQuotaMode && (
          <span className={styles.callsLeft}>
            {' '}
            • {remaining.toLocaleString()} / 1,500 left
          </span>
        )}
      </span>
    </button>
  );
}

export default CreditBadge;
