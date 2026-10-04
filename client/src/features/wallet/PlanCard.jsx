import { QrCode, Zap, Check } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';
import styles from './PlanCard.module.scss';

export function PlanCard({
  plan,
  isCurrentTier = false,
  isProcessing = false,
  onCheckout,
  onSimulate,
}) {
  const isPopular = plan.popular || plan.badge === 'Popular';
  const isUpgrade = !isCurrentTier && plan.tier === 'pro_monthly';

  const buttonLabel = isCurrentTier
    ? `Top-Up Credits (₹${plan.amountINR})`
    : isUpgrade
      ? `Upgrade to Pro Tier (₹${plan.amountINR})`
      : `Recharge ₹${plan.amountINR}`;

  return (
    <div
      className={cn(
        styles.planCard,
        isPopular && styles.popular,
        isCurrentTier && styles.currentPlan,
      )}
    >
      <div className={styles.tagRow}>
        {isCurrentTier && (
          <Badge tone="success">Your Current Plan</Badge>
        )}
        {plan.badge && !isCurrentTier && (
          <Badge tone={isPopular ? 'accent' : 'success'}>{plan.badge}</Badge>
        )}
        {plan.tier === 'pro_monthly' && !isCurrentTier && (
          <Badge tone="accent">Tier Upgrade</Badge>
        )}
      </div>

      <div>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>{plan.name}</h3>
          </div>
          <p className={styles.description}>{plan.description}</p>
        </div>

        <div className={styles.priceBlock}>
          <span className={styles.price}>₹{plan.amountINR}</span>
          <span className={styles.creditsAmount}>
            / +{plan.credits?.toLocaleString()} credits
          </span>
        </div>

        <ul className={styles.featuresList}>
          {plan.features?.map((feature, idx) => (
            <li key={idx} className={styles.featureItem}>
              <Check size={16} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.actions}>
        <Button
          variant={isPopular || isUpgrade ? 'primary' : 'secondary'}
          size="md"
          leftIcon={<QrCode size={16} />}
          loading={isProcessing}
          disabled={isProcessing}
          onClick={() => onCheckout?.(plan)}
        >
          {buttonLabel}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={styles.testAction}
          leftIcon={<Zap size={14} />}
          disabled={isProcessing}
          onClick={() => onSimulate?.(plan)}
        >
          ⚡ Instant 1-Click Test Top-Up
        </Button>
      </div>
    </div>
  );
}

export default PlanCard;
