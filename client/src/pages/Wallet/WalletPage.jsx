import { useEffect, useState } from 'react';
import { Wallet, Zap, Sparkles, CheckCircle2, Info } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { PlanCard, TransactionTable } from '@/features/wallet';
import { useAuthStore } from '@/store/authStore';
import { useWalletStore } from '@/store/walletStore';
import styles from './WalletPage.module.scss';

export default function WalletPage() {
  const user = useAuthStore((state) => state.user);

  const {
    wallet,
    plans,
    transactions,
    pagination,
    isLoadingPlans,
    isLoadingTransactions,
    isProcessingCheckout,
    checkoutPlanId,
    fetchWallet,
    fetchPlans,
    fetchTransactions,
    checkout,
    simulateTestRecharge,
  } = useWalletStore();

  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchWallet();
    fetchPlans();
    fetchTransactions(1);
  }, [fetchWallet, fetchPlans, fetchTransactions]);

  const creditsRemaining =
    wallet?.creditsRemaining ?? user?.wallet?.creditsRemaining ?? 100;
  const currentTier = wallet?.tier || user?.wallet?.tier || 'free';
  const totalTokens =
    wallet?.totalTokensConsumed ?? user?.wallet?.totalTokensConsumed ?? 0;

  const handlePaymentSuccess = (result) => {
    const creditsAdded = result.transaction?.creditsAdded || 'credits';
    setNotification(`Payment verified successfully! Added ${creditsAdded} credits to your wallet.`);
    setTimeout(() => setNotification(null), 6000);
  };

  const handleCheckout = (plan) => {
    checkout({
      plan,
      user,
      onPaymentSuccess: handlePaymentSuccess,
    });
  };

  const handleSimulate = (plan) => {
    simulateTestRecharge({
      plan,
      onPaymentSuccess: handlePaymentSuccess,
    });
  };

  return (
    <div className={styles.container}>
      <PageHeader
        title="Wallet &amp; Billing"
        description="Utility-metered credit ledger backed by real AI token usage."
      />

      {notification && (
        <div className={styles.successBanner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <CheckCircle2 size={18} />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontWeight: 'var(--weight-bold)',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Quick Test-Mode Explainer Banner */}
      <div className={styles.testNoticeBanner}>
        <Info size={18} />
        <span>
          <strong>Razorpay Test Mode Active:</strong> No real money or KYC required. Use Razorpay test card
          details or click <em>&quot;⚡ Instant Test Mode Recharge&quot;</em> for zero-friction ledger testing.
        </span>
      </div>

      {/* Metrics Row */}
      <div className={styles.statsGrid}>
        <Card padding="md">
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Available Credits</span>
            <Badge tone={creditsRemaining > 20 ? 'accent' : 'danger'}>
              {creditsRemaining > 20 ? 'Active' : 'Low Balance'}
            </Badge>
          </div>
          <div className={styles.statValueRow}>
            <span className={styles.statValue}>{creditsRemaining.toLocaleString()}</span>
            <span className={styles.statUnit}>credits</span>
          </div>
          <p className={styles.statHint}>1 credit ≈ 100 Gemini tokens consumed</p>
        </Card>

        <Card padding="md">
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Account Tier</span>
            <Badge tone={currentTier === 'pro_monthly' ? 'accent' : 'neutral'}>
              {currentTier === 'pro_monthly' ? 'Pro Member' : 'Free Tier'}
            </Badge>
          </div>
          <div className={styles.statValueRow}>
            <span className={styles.statValue}>
              {currentTier === 'pro_monthly' ? 'Pro Monthly' : 'Free Starter'}
            </span>
          </div>
          <p className={styles.statHint}>
            {currentTier === 'pro_monthly'
              ? 'Pro models, unlimited workspaces & priority streaming'
              : 'Upgrade with Power Studio Tier for pro privileges'}
          </p>
        </Card>

        <Card padding="md">
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Total Tokens Consumed</span>
            <Sparkles size={16} style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <div className={styles.statValueRow}>
            <span className={styles.statValue}>{totalTokens.toLocaleString()}</span>
            <span className={styles.statUnit}>tokens</span>
          </div>
          <p className={styles.statHint}>Cumulative input + output across all models</p>
        </Card>
      </div>

      {/* Recharge Packages Section */}
      <section>
        <div className={styles.sectionHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Zap size={20} style={{ color: 'var(--color-accent)' }} />
            <h2>Recharge Packages</h2>
          </div>
          <p>
            Credit packages and pricing are securely verified on the server. Select a tier to top-up.
          </p>
        </div>

        {isLoadingPlans && plans.length === 0 ? (
          <div className={styles.skeletonGrid}>
            <Skeleton className={styles.skeletonCard} />
            <Skeleton className={styles.skeletonCard} />
            <Skeleton className={styles.skeletonCard} />
          </div>
        ) : (
          <div className={styles.plansGrid}>
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isProcessing={isProcessingCheckout && checkoutPlanId === plan.id}
                onCheckout={handleCheckout}
                onSimulate={handleSimulate}
              />
            ))}
          </div>
        )}
      </section>

      {/* Billing Ledger / Transaction History */}
      <section>
        <div className={styles.sectionHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Wallet size={20} style={{ color: 'var(--color-text-secondary)' }} />
            <h2>Transaction History</h2>
          </div>
          <p>
            Audited transaction ledger ensuring each recharge is credited exactly once.
          </p>
        </div>

        <TransactionTable
          transactions={transactions}
          pagination={pagination}
          isLoading={isLoadingTransactions}
          onPageChange={(page) => fetchTransactions(page)}
        />
      </section>
    </div>
  );
}
