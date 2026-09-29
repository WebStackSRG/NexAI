import { useEffect, useState, useCallback } from 'react';
import {
  Wallet,
  Zap,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  PlanCard,
  TransactionTable,
  TestCredentialsCard,
  TokenEconomicsCard,
  UpiQrModal,
} from '@/features/wallet';
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
    isLoadingWallet,
    isLoadingPlans,
    isLoadingTransactions,
    isProcessingCheckout,
    checkoutPlanId,
    error,
    clearError,
    fetchWallet,
    fetchPlans,
    fetchTransactions,
    checkout,
    simulateTestRecharge,
  } = useWalletStore();

  const [notification, setNotification] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [qrModalPlan, setQrModalPlan] = useState(null);

  const loadAllData = useCallback(async () => {
    await Promise.all([fetchWallet(), fetchPlans(), fetchTransactions(1)]);
  }, [fetchWallet, fetchPlans, fetchTransactions]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleManualSync = async () => {
    setIsRefreshing(true);
    clearError();
    await loadAllData();
    setIsRefreshing(false);
  };

  const creditsRemaining =
    wallet?.creditsRemaining ?? user?.wallet?.creditsRemaining ?? 100;
  const currentTier = wallet?.tier || user?.wallet?.tier || 'free';
  const totalTokens =
    wallet?.totalTokensConsumed ?? user?.wallet?.totalTokensConsumed ?? 0;

  const handlePaymentSuccess = (result) => {
    const creditsAdded = result.transaction?.creditsAdded || 'credits';
    setNotification(
      `Payment verified successfully! Added ${creditsAdded.toLocaleString()} credits to your wallet.`,
    );
    setTimeout(() => setNotification(null), 7000);
  };

  const handlePaymentError = (_err) => {
    // Error is already stored in walletStore, but keep notification clear
    setNotification(null);
  };

  const handleCheckout = (plan) => {
    setQrModalPlan(plan);
  };

  const handleSimulate = (plan) => {
    simulateTestRecharge({
      plan,
      onPaymentSuccess: handlePaymentSuccess,
      onPaymentError: handlePaymentError,
    });
  };

  return (
    <div className={styles.container}>
      {/* Page Header with Live Balance Sync */}
      <PageHeader
        title="Wallet &amp; Billing"
        description="Utility-metered credit ledger backed by real AI token usage."
        actions={
          <Button
            variant="secondary"
            size="sm"
            leftIcon={
              <RefreshCw
                size={14}
                className={isRefreshing ? styles.spinIcon : ''}
              />
            }
            loading={isRefreshing}
            onClick={handleManualSync}
            title="Fetch latest balance from server"
          >
            Sync Balance
          </Button>
        }
      />

      {/* Global Error Banner with Retry (Rule 13) */}
      {error && (
        <div className={styles.errorBanner} role="alert">
          <div className={styles.bannerContent}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
          <div className={styles.bannerActions}>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleManualSync}
            >
              Retry
            </Button>
            <button
              type="button"
              className={styles.dismissBtn}
              onClick={clearError}
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Payment Success Alert */}
      {notification && (
        <div className={styles.successBanner} role="status">
          <div className={styles.bannerContent}>
            <CheckCircle2 size={18} />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            className={styles.dismissBtn}
            onClick={() => setNotification(null)}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* Low / Zero Balance Gatekeeping Warnings */}
      {creditsRemaining === 0 ? (
        <div className={styles.exhaustedBanner}>
          <ShieldAlert size={20} />
          <div>
            <strong>Credit Balance Exhausted (0 credits):</strong> AI chat, mock interview
            critiques, and document generations are currently paused with HTTP 402. Select a
            recharge package below to restore instant AI access.
          </div>
        </div>
      ) : creditsRemaining <= 20 ? (
        <div className={styles.lowCreditBanner}>
          <AlertTriangle size={18} />
          <div>
            <strong>Low Balance Warning:</strong> You have only {creditsRemaining} credits
            remaining (~{(creditsRemaining * 100).toLocaleString()} tokens). Top up to ensure
            uninterrupted multi-turn conversations and mock interviews.
          </div>
        </div>
      ) : null}

      {/* Metrics Row with Skeletons */}
      <div className={styles.statsGrid}>
        <Card padding="md">
          {isLoadingWallet && !wallet ? (
            <div className={styles.skeletonStat}>
              <Skeleton style={{ height: 16, width: '40%' }} />
              <Skeleton style={{ height: 36, width: '60%', margin: '8px 0' }} />
              <Skeleton style={{ height: 12, width: '70%' }} />
            </div>
          ) : (
            <>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>Available Credits</span>
                <Badge tone={creditsRemaining > 20 ? 'accent' : 'danger'}>
                  {creditsRemaining > 20 ? 'Active' : 'Low Balance'}
                </Badge>
              </div>
              <div className={styles.statValueRow}>
                <span className={styles.statValue}>
                  {creditsRemaining.toLocaleString()}
                </span>
                <span className={styles.statUnit}>credits</span>
              </div>
              <p className={styles.statHint}>1 credit ≈ 100 Gemini tokens consumed</p>
            </>
          )}
        </Card>

        <Card padding="md">
          {isLoadingWallet && !wallet ? (
            <div className={styles.skeletonStat}>
              <Skeleton style={{ height: 16, width: '40%' }} />
              <Skeleton style={{ height: 36, width: '60%', margin: '8px 0' }} />
              <Skeleton style={{ height: 12, width: '70%' }} />
            </div>
          ) : (
            <>
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
            </>
          )}
        </Card>

        <Card padding="md">
          {isLoadingWallet && !wallet ? (
            <div className={styles.skeletonStat}>
              <Skeleton style={{ height: 16, width: '40%' }} />
              <Skeleton style={{ height: 36, width: '60%', margin: '8px 0' }} />
              <Skeleton style={{ height: 12, width: '70%' }} />
            </div>
          ) : (
            <>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>Total Tokens Consumed</span>
                <Sparkles size={16} style={{ color: 'var(--color-text-muted)' }} />
              </div>
              <div className={styles.statValueRow}>
                <span className={styles.statValue}>{totalTokens.toLocaleString()}</span>
                <span className={styles.statUnit}>tokens</span>
              </div>
              <p className={styles.statHint}>Cumulative input + output across all models</p>
            </>
          )}
        </Card>
      </div>

      {/* Razorpay Test Mode Sandbox Credentials Drawer */}
      <TestCredentialsCard />

      {/* Recharge Packages Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleRow}>
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

      {/* Token & Credit Economics Guide */}
      <TokenEconomicsCard />

      {/* Billing Ledger / Transaction History */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleRow}>
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

      {/* Direct Razorpay UPI & QR Checkout Modal */}
      <UpiQrModal
        open={Boolean(qrModalPlan)}
        plan={qrModalPlan}
        isProcessing={isProcessingCheckout}
        onClose={() => setQrModalPlan(null)}
        onConfirmPayment={() => {
          if (!qrModalPlan) return;
          simulateTestRecharge({
            plan: qrModalPlan,
            onPaymentSuccess: (result) => {
              handlePaymentSuccess(result);
              setQrModalPlan(null);
            },
            onPaymentError: handlePaymentError,
          });
        }}
        onOpenRazorpayDirect={() => {
          if (!qrModalPlan) return;
          checkout({
            plan: qrModalPlan,
            user,
            onPaymentSuccess: (result) => {
              handlePaymentSuccess(result);
              setQrModalPlan(null);
            },
            onPaymentError: handlePaymentError,
          });
        }}
      />
    </div>
  );
}
