import { useEffect, useState, useCallback } from 'react';
import {
  Wallet,
  Zap,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Crown,
  ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  PlanCard,
  TransactionTable,
  RazorpayPaymentModal,
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
    isLoadingTransactions,
    isProcessingCheckout,
    error,
    clearError,
    fetchWallet,
    fetchPlans,
    fetchTransactions,
    simulateTestRecharge,
  } = useWalletStore();

  const [notification, setNotification] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeCheckoutPlan, setActiveCheckoutPlan] = useState(null);

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
    wallet?.creditsRemaining ?? user?.wallet?.creditsRemaining ?? 0;
  const currentTier = wallet?.tier || user?.wallet?.tier || 'free';
  const totalTokens =
    wallet?.totalTokensConsumed ?? user?.wallet?.totalTokensConsumed ?? 0;

  const governance = useWalletStore((state) => state.governance);
  const isQuotaMode = (governance?.billingEnforcementMode ?? 'quota_free') === 'quota_free';
  const dailyLimit = governance?.dailyGeminiQuotaLimit || 1500;
  const callsRemaining = governance?.dailyRequestsRemaining ?? dailyLimit;

  const isPro = currentTier === 'pro_monthly';

  const handlePaymentSuccess = (result) => {
    const creditsAdded = result.transaction?.creditsAdded || 'credits';
    setNotification(
      `Payment verified! +${creditsAdded.toLocaleString()} credits added to your wallet.`,
    );
    setTimeout(() => setNotification(null), 7000);
  };

  const handleOpenCheckout = (plan) => {
    setActiveCheckoutPlan(plan);
  };

  const handleModalPayment = async (plan) => {
    return new Promise((resolve, reject) => {
      simulateTestRecharge({
        plan,
        onPaymentSuccess: (result) => {
          handlePaymentSuccess(result);
          resolve(result);
        },
        onPaymentError: (err) => {
          reject(err);
        },
      });
    });
  };

  const handleDirectSimulate = (plan) => {
    simulateTestRecharge({
      plan,
      onPaymentSuccess: handlePaymentSuccess,
    });
  };

  return (
    <div className={styles.container}>
      {/* Header */}
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
            title="Sync balance from server"
          >
            Sync Balance
          </Button>
        }
      />

      {/* Quota-Free Mode Governance Banner */}
      {isQuotaMode && (
        <div className={styles.quotaModeBanner}>
          <div className={styles.quotaModeHeader}>
            <Zap size={18} className={styles.quotaIcon} />
            <div className={styles.quotaText}>
              <strong>⚡ Quota-Free Evaluation Mode Active:</strong>
              <span>
                Demonstration mode enabled using Google Gemini API free-tier quota ({callsRemaining.toLocaleString()} / {dailyLimit.toLocaleString()} daily calls left today • Resets at 00:00 UTC). Credit deductions and token telemetry are simulated in real time.
              </span>
            </div>
            <Badge tone="accent">1,500 RPD Active</Badge>
          </div>
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <div className={styles.errorBanner} role="alert">
          <div className={styles.bannerContent}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
          <div className={styles.bannerActions}>
            <Button variant="secondary" size="sm" onClick={handleManualSync}>
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

      {/* Zero Balance / Low Balance Banner */}
      {creditsRemaining === 0 ? (
        isQuotaMode ? (
          <div className={styles.quotaFreeDepletedBanner}>
            <Zap size={20} />
            <div>
              <strong>Simulated Credits Depleted (0 credits) — Unrestricted Demo Active:</strong> Under Quota-Free Evaluation Mode, AI chat, mock interviews, and document drafting continue running without interruption using Google Gemini Free Tier quota ({callsRemaining.toLocaleString()} calls remaining today). You can also test a recharge package below to demonstrate the Razorpay payment gateway.
            </div>
          </div>
        ) : (
          <div className={styles.exhaustedBanner}>
            <ShieldAlert size={20} />
            <div>
              <strong>Credit Balance Exhausted (0 credits):</strong> AI chat, mock interview
              critiques, and document generations are currently paused with HTTP 402. Select a
              recharge package below to restore instant AI access.
            </div>
          </div>
        )
      ) : creditsRemaining <= 20 ? (
        <div className={styles.lowCreditBanner}>
          <AlertTriangle size={18} />
          <div>
            <strong>Low Balance Warning:</strong> You have only {creditsRemaining} credits
            remaining. Top up below to avoid conversation interruption.
          </div>
        </div>
      ) : null}

      {/* Unified "My Current Plan & Credits" Window */}
      <Card padding="lg" className={styles.myPlanCard}>
        <div className={styles.myPlanGrid}>
          {/* Active Tier Column */}
          <div className={styles.tierCol}>
            <div className={styles.tierHeader}>
              <Crown size={20} className={isPro ? styles.crownPro : styles.crownFree} />
              <span className={styles.tierSubtitle}>Current Active Plan</span>
            </div>
            <div className={styles.tierTitleRow}>
              <h2 className={styles.tierTitle}>
                {isPro ? 'Pro Monthly Tier' : 'Free Starter Tier'}
              </h2>
              <Badge tone={isPro ? 'accent' : 'neutral'}>
                {isPro ? 'Pro Member' : 'Standard'}
              </Badge>
            </div>
            <p className={styles.tierPerks}>
              {isPro
                ? '✓ Gemini 3.1 Pro & Flash access • Priority streaming • Unlimited workspaces'
                : 'Standard Gemini 3.8 Flash access • Personal library • 1 credit ≈ 100 tokens'}
            </p>
          </div>

          {/* Credits Balance Column */}
          <div className={styles.creditsCol}>
            <div className={styles.creditsHeader}>
              <span className={styles.colLabel}>
                {isQuotaMode ? 'Simulated Credits' : 'Available Credits'}
              </span>
              <Badge tone={isQuotaMode ? 'accent' : creditsRemaining > 20 ? 'accent' : 'danger'}>
                {isQuotaMode ? 'Quota Mode' : creditsRemaining > 20 ? 'Active' : 'Depleted'}
              </Badge>
            </div>
            <div className={styles.creditValueRow}>
              <span className={styles.creditsBig}>{creditsRemaining.toLocaleString()}</span>
              <span className={styles.creditsUnit}>credits</span>
            </div>
            <span className={styles.creditsHint}>
              {isQuotaMode
                ? `1 credit ≈ 100 Gemini tokens • ⚡ ${callsRemaining.toLocaleString()} / 1,500 daily calls left`
                : '1 credit = 100 Gemini tokens (atomic source metering)'}
            </span>
          </div>

          {/* Cumulative Token Consumption Column */}
          <div className={styles.usageCol}>
            <div className={styles.usageHeader}>
              <span className={styles.colLabel}>Total Tokens Consumed</span>
              <Sparkles size={16} className={styles.sparkleIcon} />
            </div>
            <div className={styles.tokenValueRow}>
              <span className={styles.tokensBig}>{totalTokens.toLocaleString()}</span>
              <span className={styles.tokensUnit}>tokens</span>
            </div>
            <span className={styles.creditsHint}>Cumulative input + output across all models</span>
          </div>
        </div>
      </Card>

      {/* Recharge & Upgrade Plans Section */}
      <section className={styles.plansSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleRow}>
            <Zap size={22} className={styles.zapIcon} />
            <h2>Recharge &amp; Upgrade Plans</h2>
          </div>
          <p>
            Choose a recharge top-up or upgrade to Pro Monthly. Secured via Razorpay Test Mode with dynamic UPI &amp; QR verification.
          </p>
        </div>

        <div className={styles.plansGrid}>
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrentTier={isPro && plan.tier === 'pro_monthly'}
              isProcessing={isProcessingCheckout && activeCheckoutPlan?.id === plan.id}
              onCheckout={handleOpenCheckout}
              onSimulate={handleDirectSimulate}
            />
          ))}
        </div>
      </section>

      {/* Billing Ledger / Transaction History */}
      <section className={styles.historySection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleRow}>
            <Wallet size={20} style={{ color: 'var(--color-text-secondary)' }} />
            <h2>Transaction History</h2>
          </div>
          <p>Audited transaction ledger ensuring each recharge is credited exactly once.</p>
        </div>

        <TransactionTable
          transactions={transactions}
          pagination={pagination}
          isLoading={isLoadingTransactions}
          onPageChange={(page) => fetchTransactions(page)}
        />
      </section>

      {/* Razorpay Test Mode Animation Modal */}
      <RazorpayPaymentModal
        open={Boolean(activeCheckoutPlan)}
        plan={activeCheckoutPlan}
        onClose={() => setActiveCheckoutPlan(null)}
        onPaymentSuccess={handleModalPayment}
      />
    </div>
  );
}
