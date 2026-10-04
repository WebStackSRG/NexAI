import { useEffect, useState } from 'react';
import {
  Zap,
  Users,
  CreditCard,
  AlertOctagon,
  RefreshCw,
  Receipt,
  Terminal,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { useAdminStore } from '@/store/adminStore';
import {
  StatCard,
  UsageChart,
  ModelSplitChart,
  RecentTransactionsTable,
  ErrorLogsTable,
  QuotaTelemetryCard,
} from '@/features/admin';
import styles from './AdminPage.module.scss';

export default function AdminPage() {
  const {
    stats,
    usageData,
    systemConfig,
    telemetry,
    isUpdatingConfig,
    range,
    transactions,
    errors,
    isLoading,
    isLoadingTransactions,
    isLoadingErrors,
    error,
    fetchOverview,
    fetchTransactions,
    fetchErrors,
    updateBillingMode,
    setRange,
  } = useAdminStore();

  const [activeBottomTab, setActiveBottomTab] = useState('transactions'); // 'transactions' | 'errors'

  useEffect(() => {
    fetchOverview();
    fetchTransactions(1);
    fetchErrors(1);
  }, [fetchOverview, fetchTransactions, fetchErrors]);

  const handleRefresh = () => {
    fetchOverview();
    if (activeBottomTab === 'transactions') {
      fetchTransactions(transactions.page);
    } else {
      fetchErrors(errors.page);
    }
  };

  const isQuotaFree = (systemConfig?.billingEnforcementMode || 'quota_free') === 'quota_free';

  return (
    <div className={styles.container}>
      <PageHeader
        title="Admin Analytics & Telemetry"
        description="Live LLM token consumption metrics, model usage distribution, recharge transactions, and error logs."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Button
              variant={isQuotaFree ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => updateBillingMode(isQuotaFree ? 'credit_strict' : 'quota_free')}
              loading={isUpdatingConfig}
            >
              {isQuotaFree ? 'Switch to Credit-Strict SaaS' : 'Switch to Quota-Free Demo'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              loading={isLoading}
              disabled={isLoading}
            >
              <RefreshCw size={14} style={{ marginRight: 6 }} />
              Refresh Data
            </Button>
          </div>
        }
      />

      {error && (
        <div className={styles.errorBanner} role="alert">
          <span>{error}</span>
          <Button variant="secondary" size="sm" onClick={handleRefresh}>
            Retry
          </Button>
        </div>
      )}

      {/* KPI StatCards Row */}
      <section className={styles.statsGrid}>
        {isLoading && !stats ? (
          <>
            <Skeleton height="110px" radius="lg" />
            <Skeleton height="110px" radius="lg" />
            <Skeleton height="110px" radius="lg" />
            <Skeleton height="110px" radius="lg" />
          </>
        ) : (
          <>
            <StatCard
              title="Total Tokens Consumed"
              value={Number(stats?.totalTokens || 0).toLocaleString()}
              subtitle={`${Number(stats?.totalCreditsDeducted || 0).toLocaleString()} credits debited`}
              icon={<Zap size={18} />}
              tone="accent"
            />
            <StatCard
              title="Platform Revenue"
              value={`₹${Number(stats?.totalRevenue || 0).toLocaleString()}`}
              subtitle={`${stats?.successfulTransactions || 0} completed top-ups`}
              icon={<CreditCard size={18} />}
              tone="info"
            />
            <StatCard
              title="Active Platform Users"
              value={stats?.activeUsers ?? 0}
              subtitle="Registered accounts"
              icon={<Users size={18} />}
              tone="default"
            />
            <StatCard
              title="Error Telemetry"
              value={stats?.totalErrors ?? 0}
              subtitle={stats?.totalErrors === 0 ? 'All systems nominal' : 'Recorded incidents'}
              icon={<AlertOctagon size={18} />}
              tone={stats?.totalErrors > 0 ? 'danger' : 'accent'}
            />
          </>
        )}
      </section>

      {/* Live Gemini API Quota Telemetry & Governance Switch */}
      <section className={styles.telemetrySection}>
        <QuotaTelemetryCard
          telemetry={telemetry}
          config={systemConfig}
          onModeToggle={updateBillingMode}
          isUpdating={isUpdatingConfig}
        />
      </section>

      {/* Charts Row */}
      <section className={styles.chartsGrid}>
        <div className={styles.usageChartWrapper}>
          {isLoading && !usageData ? (
            <Skeleton height="360px" radius="lg" />
          ) : (
            <UsageChart
              data={usageData?.timeSeries || []}
              range={range}
              onRangeChange={setRange}
            />
          )}
        </div>
        <div className={styles.modelChartWrapper}>
          {isLoading && !usageData ? (
            <Skeleton height="360px" radius="lg" />
          ) : (
            <ModelSplitChart
              data={usageData?.modelSplit || []}
              featureSplit={usageData?.featureSplit || []}
            />
          )}
        </div>
      </section>

      {/* Bottom Data Tables with Sub-Tabs */}
      <section className={styles.tablesSection}>
        <div className={styles.tableTabs}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeBottomTab === 'transactions' ? styles.active : ''}`}
            onClick={() => {
              setActiveBottomTab('transactions');
              if (transactions.list.length === 0) fetchTransactions(1);
            }}
          >
            <Receipt size={15} style={{ marginRight: 6 }} />
            Platform Recharges ({transactions.total})
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeBottomTab === 'errors' ? styles.active : ''}`}
            onClick={() => {
              setActiveBottomTab('errors');
              if (errors.list.length === 0) fetchErrors(1);
            }}
          >
            <Terminal size={15} style={{ marginRight: 6 }} />
            Error Telemetry ({errors.total})
          </button>
        </div>

        <div className={styles.tableContent}>
          {activeBottomTab === 'transactions' ? (
            <RecentTransactionsTable
              transactions={transactions.list}
              total={transactions.total}
              page={transactions.page}
              totalPages={transactions.totalPages}
              isLoading={isLoadingTransactions}
              onPageChange={(page) => fetchTransactions(page)}
            />
          ) : (
            <ErrorLogsTable
              errors={errors.list}
              total={errors.total}
              page={errors.page}
              totalPages={errors.totalPages}
              isLoading={isLoadingErrors}
              onPageChange={(page) => fetchErrors(page)}
            />
          )}
        </div>
      </section>
    </div>
  );
}
