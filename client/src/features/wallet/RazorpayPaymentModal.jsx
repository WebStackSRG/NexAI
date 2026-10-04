import { useState, useEffect, useMemo } from 'react';
import {
  QrCode,
  Copy,
  Check,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  X,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import styles from './RazorpayPaymentModal.module.scss';

/**
 * Deterministically generates a realistic 29x29 QR code module matrix
 */
function generateQrMatrix(seedStr) {
  const size = 29;
  const matrix = Array.from({ length: size }, () => Array(size).fill(false));

  const fillFinder = (startR, startC) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[startR + r][startC + c] = isBorder || isCenter;
      }
    }
  };

  // Top-left, top-right, bottom-left finders
  fillFinder(0, 0);
  fillFinder(0, size - 7);
  fillFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Alignment pattern at bottom-right
  const alignR = 20;
  const alignC = 20;
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const isBorder = Math.abs(r) === 2 || Math.abs(c) === 2;
      const isCenter = r === 0 && c === 0;
      matrix[alignR + r][alignC + c] = isBorder || isCenter;
    }
  }

  // Deterministic seed hash
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }

  // Fill data modules (avoiding finders and center emblem area)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip finder zones + separators
      if (r < 8 && c < 8) continue;
      if (r < 8 && c >= size - 8) continue;
      if (r >= size - 8 && c < 8) continue;

      // Skip timing patterns
      if (r === 6 || c === 6) continue;

      // Skip alignment pattern zone
      if (Math.abs(r - alignR) <= 2 && Math.abs(c - alignC) <= 2) continue;

      // Skip center logo zone
      if (r >= 11 && r <= 17 && c >= 11 && c <= 17) continue;

      // Pseudo-random pseudo-data bit
      const val = Math.sin(r * 13 + c * 37 + hash) * 10000;
      matrix[r][c] = (val - Math.floor(val)) > 0.48;
    }
  }

  return matrix;
}

export function RazorpayPaymentModal({
  open,
  plan,
  onClose,
  onPaymentSuccess,
}) {
  const [stage, setStage] = useState('checkout'); // 'checkout' | 'processing' | 'success'
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [transactionData, setTransactionData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600);

  useEffect(() => {
    if (!open) {
      setStage('checkout');
      setProcessingStep(0);
      setTransactionData(null);
      setTimeLeft(600);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [open]);

  const qrMatrix = useMemo(() => {
    return generateQrMatrix(plan?.id || 'starter_pack');
  }, [plan?.id]);

  if (!open || !plan) return null;

  const upiId = 'success@razorpay';
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handlePay = async () => {
    setStage('processing');
    setProcessingStep(1);

    const stepTimer = setTimeout(() => {
      setProcessingStep(2);
    }, 1200);

    try {
      if (onPaymentSuccess) {
        const result = await onPaymentSuccess(plan);
        clearTimeout(stepTimer);
        setTransactionData(result);
        setStage('success');
      }
    } catch {
      clearTimeout(stepTimer);
      setStage('checkout');
    }
  };

  return (
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className={styles.modal} role="dialog" aria-modal="true">
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.rzpIconBadge}>
              <span>R</span>
            </div>
            <div>
              <div className={styles.titleRow}>
                <h3 className={styles.title}>Razorpay Payment</h3>
                <Badge tone="accent">Test Mode</Badge>
              </div>
              <span className={styles.subtitle}>Direct UPI &amp; Dynamic QR Authorization</span>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Plan Summary Bar */}
        <div className={styles.planSummaryBar}>
          <div>
            <span className={styles.planName}>{plan.name}</span>
            <span className={styles.planCredits}>
              +{plan.credits?.toLocaleString()} AI Credits
            </span>
          </div>
          <div className={styles.amountDisplay}>
            <span className={styles.amountLabel}>Total</span>
            <span className={styles.amountValue}>₹{plan.amountINR}.00</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className={styles.body}>
          {stage === 'checkout' && (
            <div className={styles.checkoutView}>
              {/* QR Container */}
              <div className={styles.qrCard}>
                <div className={styles.qrTopBar}>
                  <div className={styles.qrLabel}>
                    <QrCode size={15} />
                    <span>Scan with Any UPI App</span>
                  </div>
                  <span className={styles.timer}>
                    Expires in <strong>{formattedTime}</strong>
                  </span>
                </div>

                {/* High Density Vector QR Code with Scanning Radar Animation */}
                <div className={styles.qrCanvasWrapper}>
                  <div className={styles.scanLine} />
                  <svg
                    className={styles.qrSvg}
                    viewBox="0 0 116 116"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-label="Razorpay UPI Dynamic QR Code"
                  >
                    <rect width="116" height="116" fill="#ffffff" rx="6" />

                    {/* 29x29 Module Matrix */}
                    <g fill="#0f172a">
                      {qrMatrix.map((row, r) =>
                        row.map((filled, c) => {
                          if (!filled) return null;
                          return (
                            <rect
                              key={`${r}-${c}`}
                              x={r * 4}
                              y={c * 4}
                              width={3.8}
                              height={3.8}
                              rx={0.6}
                            />
                          );
                        }),
                      )}
                    </g>

                    {/* Central UPI Badge */}
                    <rect x="42" y="42" width="32" height="32" rx="6" fill="#ffffff" />
                    <rect x="44" y="44" width="28" height="28" rx="4" fill="#0f172a" />
                    <text
                      x="58"
                      y="62"
                      textAnchor="middle"
                      fill="#22c55e"
                      fontSize="9"
                      fontWeight="900"
                      fontFamily="system-ui, sans-serif"
                    >
                      UPI
                    </text>
                  </svg>
                </div>

                {/* Supported UPI Apps Pills */}
                <div className={styles.appsRow}>
                  <span className={styles.appPill}>Google Pay</span>
                  <span className={styles.appPill}>PhonePe</span>
                  <span className={styles.appPill}>Paytm</span>
                  <span className={styles.appPill}>BHIM</span>
                  <span className={styles.appPill}>Cred</span>
                </div>
              </div>

              {/* UPI ID Fallback Row */}
              <div className={styles.upiRow}>
                <div className={styles.upiDetails}>
                  <span className={styles.upiTitle}>Or authorize via Sandbox VPA</span>
                  <span className={styles.upiAddress}>{upiId}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={copiedUpi ? <Check size={13} /> : <Copy size={13} />}
                  onClick={handleCopyUpi}
                >
                  {copiedUpi ? 'Copied' : 'Copy'}
                </Button>
              </div>

              {/* Action Button */}
              <Button
                variant="primary"
                size="lg"
                className={styles.submitBtn}
                leftIcon={<QrCode size={16} />}
                onClick={handlePay}
              >
                ⚡ Authorize Test Payment (₹{plan.amountINR})
              </Button>

              <div className={styles.securityNote}>
                <ShieldCheck size={14} />
                <span>Zero real card or banking details required • Razorpay Test Mode</span>
              </div>
            </div>
          )}

          {stage === 'processing' && (
            <div className={styles.processingView}>
              <div className={styles.spinnerRing}>
                <Loader2 size={44} className={styles.spinnerIcon} />
              </div>
              <h4 className={styles.processingTitle}>Authorizing Payment...</h4>
              <p className={styles.processingDesc}>
                {processingStep === 1
                  ? 'Communicating with Razorpay Test Mode Gateway...'
                  : 'Verifying cryptographic HMAC signature on server...'}
              </p>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: processingStep === 1 ? '55%' : '90%' }}
                />
              </div>
            </div>
          )}

          {stage === 'success' && (
            <div className={styles.successView}>
              <div className={styles.successIconWrapper}>
                <CheckCircle2 size={54} className={styles.checkIcon} />
              </div>
              <h4 className={styles.successTitle}>Payment Verified!</h4>
              <p className={styles.successSub}>
                ₹{plan.amountINR}.00 credited to your account
              </p>

              <div className={styles.receiptBox}>
                <div className={styles.receiptRow}>
                  <span>Credits Added:</span>
                  <strong className={styles.creditValue}>
                    +{plan.credits?.toLocaleString()} Credits
                  </strong>
                </div>
                <div className={styles.receiptRow}>
                  <span>Payment Gateway:</span>
                  <span>Razorpay Test Mode (UPI)</span>
                </div>
                <div className={styles.receiptRow}>
                  <span>Transaction ID:</span>
                  <code className={styles.monoId}>
                    {transactionData?.transaction?.paymentId || 'pay_test_verified'}
                  </code>
                </div>
                {plan.tier === 'pro_monthly' && (
                  <div className={styles.proUpgradeBanner}>
                    <Sparkles size={14} />
                    <span>Unlocked Pro Monthly Member Tier!</span>
                  </div>
                )}
              </div>

              <Button
                variant="primary"
                size="lg"
                className={styles.submitBtn}
                onClick={onClose}
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RazorpayPaymentModal;
