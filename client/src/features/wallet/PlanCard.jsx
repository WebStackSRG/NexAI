import { QrCode, Smartphone, Check } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';
import styles from './PlanCard.module.scss';

export function PlanCard({ plan, isProcessing = false, onCheckout, onSimulate }) {
  const isPopular = plan.popular || plan.badge === 'Popular';

  return (
    <div className={cn(styles.planCard, isPopular && styles.popular)}>
      {plan.badge && (
        <div className={styles.popularTag}>
          <Badge tone={isPopular ? 'accent' : 'success'}>{plan.badge}</Badge>
        </div>
      )}

      <div>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>{plan.name}</h3>
            {plan.tier === 'pro_monthly' && (
              <Badge tone="accent">Pro Tier</Badge>
            )}
          </div>
          <p className={styles.description}>{plan.description}</p>
        </div>

        <div className={styles.priceBlock}>
          <span className={styles.price}>₹{plan.amountINR}</span>
          <span className={styles.creditsAmount}>
            / {plan.credits?.toLocaleString()} credits
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
          variant={isPopular ? 'primary' : 'secondary'}
          size="md"
          leftIcon={<QrCode size={16} />}
          loading={isProcessing}
          disabled={isProcessing}
          onClick={() => onCheckout?.(plan)}
        >
          Pay via UPI / QR ₹{plan.amountINR}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={styles.testAction}
          leftIcon={<Smartphone size={14} />}
          disabled={isProcessing}
          onClick={() => onSimulate?.(plan)}
        >
          ⚡ Instant UPI Verification
        </Button>
      </div>
    </div>
  );
}

export default PlanCard;
