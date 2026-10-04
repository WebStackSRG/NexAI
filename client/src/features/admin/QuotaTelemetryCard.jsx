import { useState } from 'react';
import {
  Zap,
  Activity,
  Gauge,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  Lock,
  Clock,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import styles from './QuotaTelemetryCard.module.scss';

/**
 * QuotaTelemetryCard component - Displays live Google Gemini API quota metrics,
 * rate limit monitors (1,500 RPD, 15 RPM, 1M TPM), daily token breakdown, and 1-click mode toggle.
 *
 * @param {object} props
 * @param {object} props.telemetry - Gemini API telemetry metrics from backend
 * @param {object} props.config - System governance config from backend
 * @param {(mode: string) => Promise<any>} props.onModeToggle - Toggle callback
 * @param {boolean} [props.isUpdating=false] - Whether toggle update is in flight
 */
export function QuotaTelemetryCard({
  telemetry,
  config,
  onModeToggle,
  isUpdating = false,
}) {
  const [toggleLoading, setToggleLoading] = useState(false);

  const activeMode = config?.billingEnforcementMode || 'quota_free';
  const isQuotaFree = activeMode === 'quota_free';

  const dailyLimit = telemetry?.dailyLimit ?? 1500;
  const requestsToday = telemetry?.requestsToday ?? 0;
  const requestsRemaining = telemetry?.requestsRemaining ?? Math.max(0, dailyLimit - requestsToday);
  const quotaPercentage = telemetry?.quotaUsedPercentage ?? Math.min(
    100,
    Number(((requestsToday / dailyLimit) * 100).toFixed(1)),
  );

  const rpm = telemetry?.rpm ?? 0;
  const rpmLimit = telemetry?.rpmLimit ?? 15;
  const rpmPercent = Math.min(100, Math.round((rpm / rpmLimit) * 100));

  const tpm = telemetry?.tpm ?? 0;
  const tpmLimit = telemetry?.tpmLimit ?? 1000000;

  const tokensToday = telemetry?.tokensToday || {
    total: 0,
    inputTokens: 0,
    outputTokens: 0,
    flashTokens: 0,
    proTokens: 0,
  };

  const handleToggle = async () => {
    const nextMode = isQuotaFree ? 'credit_strict' : 'quota_free';
    setToggleLoading(true);
    try {
      if (onModeToggle) {
        await onModeToggle(nextMode);
      }
    } finally {
      setToggleLoading(false);
    }
  };

  return (
    <Card className={styles.container}>
      {/* Top Header with 1-Click Mode Toggle */}
      <div className={styles.headerRow}>
        <div className={styles.headerInfo}>
          <div className={styles.titleGroup}>
            <div className={styles.iconCircle}>
              <Gauge size={20} />
            </div>
            <div>
              <div className={styles.titleWithBadge}>
                <h3 className={styles.title}>Live Google Gemini API Quota Telemetry</h3>
                <Badge tone={isQuotaFree ? 'accent' : 'warning'}>
                  {isQuotaFree ? '⚡ Quota-Free Active' : '🔒 Credit-Strict Active'}
                </Badge>
              </div>
              <p className={styles.description}>
                Free-tier limits (1,500 RPD • 15 RPM • 1M TPM) reset daily at 00:00 UTC.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.toggleGroup}>
          <div className={styles.modeStatus}>
            <span className={styles.modeLabel}>Active Billing Governance:</span>
            <strong className={styles.modeName}>
              {isQuotaFree ? 'Quota-Free Demo (1,500 RPD)' : 'Credit-Strict SaaS (100 Starter)'}
            </strong>
          </div>
          <Button
            variant={isQuotaFree ? 'secondary' : 'primary'}
            size="sm"
            onClick={handleToggle}
            loading={toggleLoading || isUpdating}
            leftIcon={
              isQuotaFree ? <Lock size={14} /> : <Zap size={14} />
            }
            className={styles.toggleBtn}
          >
            {isQuotaFree ? 'Switch to Credit-Strict SaaS' : 'Switch to Quota-Free Demo'}
          </Button>
        </div>
      </div>

      {/* Main Grid: 1,500 RPD Gauge | Rate Monitors | Daily Token Breakdown */}
      <div className={styles.metricsGrid}>
        {/* 1,500 RPD Daily Progress Gauge */}
        <div className={styles.metricCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Daily Quota Progress (1,500 RPD)</span>
            <Clock size={15} className={styles.cardIcon} />
          </div>

          <div className={styles.rpdValueRow}>
            <span className={styles.rpdBig}>{requestsToday.toLocaleString()}</span>
            <span className={styles.rpdCeiling}>/ {dailyLimit.toLocaleString()} requests</span>
          </div>

          {/* Progress Bar Gauge */}
          <div className={styles.progressBarWrapper}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${Math.max(2, Math.min(100, quotaPercentage))}%` }}
              role="progressbar"
              aria-valuenow={requestsToday}
              aria-valuemin={0}
              aria-valuemax={dailyLimit}
            />
          </div>

          <div className={styles.gaugeFooter}>
            <span className={styles.quotaPct}>{quotaPercentage}% consumed</span>
            <span className={styles.callsLeft}>
              <strong>{requestsRemaining.toLocaleString()}</strong> calls remaining today
            </span>
          </div>
        </div>

        {/* 15 RPM & TPM Live Rate Limit Indicators */}
        <div className={styles.metricCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Live Rate Limit Indicators</span>
            <Activity size={15} className={styles.cardIcon} />
          </div>

          <div className={styles.rateRow}>
            <div className={styles.rateCol}>
              <span className={styles.rateSub}>Requests / Min (15 Limit)</span>
              <div className={styles.rateVal}>
                <span className={styles.valNumber}>{rpm}</span>
                <span className={styles.valMax}>/ 15 RPM</span>
              </div>
              <div className={styles.miniBar}>
                <div
                  className={styles.miniBarFill}
                  style={{
                    width: `${Math.max(4, rpmPercent)}%`,
                    backgroundColor: rpm >= 12 ? 'var(--color-danger)' : 'var(--color-accent)',
                  }}
                />
              </div>
            </div>

            <div className={styles.rateDivider} />

            <div className={styles.rateCol}>
              <span className={styles.rateSub}>Tokens / Min (1M Limit)</span>
              <div className={styles.rateVal}>
                <span className={styles.valNumber}>{tpm.toLocaleString()}</span>
                <span className={styles.valMax}>/ 1M TPM</span>
              </div>
              <div className={styles.miniBar}>
                <div
                  className={styles.miniBarFill}
                  style={{
                    width: `${Math.max(4, Math.min(100, (tpm / tpmLimit) * 100))}%`,
                    backgroundColor: 'var(--color-info)',
                  }}
                />
              </div>
            </div>
          </div>

          <div className={styles.safetyFooter}>
            <ShieldCheck size={14} className={styles.shieldIcon} />
            <span>Rate governors nominal • Safe burst capacity</span>
          </div>
        </div>

        {/* Daily Token Breakdown (Input / Output / Models) */}
        <div className={styles.metricCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Daily Token Consumption Breakdown</span>
            <Sparkles size={15} className={styles.cardIcon} />
          </div>

          <div className={styles.tokenTotalRow}>
            <span className={styles.tokenBig}>{tokensToday.total.toLocaleString()}</span>
            <span className={styles.tokenUnit}>tokens today</span>
          </div>

          <div className={styles.tokenSplitList}>
            <div className={styles.splitItem}>
              <div className={styles.splitTitle}>
                <ArrowDownLeft size={13} className={styles.inputArrow} />
                <span>Input (Prompt):</span>
              </div>
              <strong>{tokensToday.inputTokens.toLocaleString()}</strong>
            </div>

            <div className={styles.splitItem}>
              <div className={styles.splitTitle}>
                <ArrowUpRight size={13} className={styles.outputArrow} />
                <span>Output (Candidate):</span>
              </div>
              <strong>{tokensToday.outputTokens.toLocaleString()}</strong>
            </div>

            <div className={styles.modelPillRow}>
              <span className={styles.modelChip}>Flash: {tokensToday.flashTokens.toLocaleString()}</span>
              <span className={styles.modelChip}>Pro: {tokensToday.proTokens.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default QuotaTelemetryCard;
