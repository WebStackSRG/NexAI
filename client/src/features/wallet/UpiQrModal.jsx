import { useState, useEffect } from 'react';
import { QrCode, Smartphone, Copy, Check, ShieldCheck } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import styles from './UpiQrModal.module.scss';

export function UpiQrModal({
  open,
  plan,
  _orderId,
  isProcessing = false,
  onClose,
  onConfirmPayment,
  onOpenRazorpayDirect,
}) {
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  useEffect(() => {
    if (!open) {
      setTimeLeft(600);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [open]);

  if (!plan) return null;

  const upiId = 'razorpay.nexai@upi';
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Direct Razorpay UPI &amp; QR Payment"
      className={styles.modal}
      footer={
        <div className={styles.modalFooter}>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <div className={styles.rightActions}>
            {onOpenRazorpayDirect && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Smartphone size={14} />}
                onClick={onOpenRazorpayDirect}
                disabled={isProcessing}
              >
                Razorpay Pop-up
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Check size={14} />}
              loading={isProcessing}
              disabled={isProcessing}
              onClick={onConfirmPayment}
            >
              Simulate Scan &amp; Approve
            </Button>
          </div>
        </div>
      }
    >
      <div className={styles.body}>
        {/* Top Header Summary */}
        <div className={styles.summaryBox}>
          <div>
            <span className={styles.planName}>{plan.name}</span>
            <div className={styles.creditsInfo}>
              +{plan.credits?.toLocaleString()} AI Credits
            </div>
          </div>
          <div className={styles.amountBox}>
            <span className={styles.amountLabel}>Total to Pay</span>
            <span className={styles.amountValue}>₹{plan.amountINR}</span>
          </div>
        </div>

        {/* QR Code Container */}
        <div className={styles.qrCard}>
          <div className={styles.qrHeader}>
            <div className={styles.upiBadge}>
              <QrCode size={14} />
              <span>Razorpay Dynamic UPI QR</span>
            </div>
            <span className={styles.expiryTimer}>
              Expires in <strong>{formattedTime}</strong>
            </span>
          </div>

          {/* SVG QR Code Rendering with Corner Finders and Central UPI Pill */}
          <div className={styles.qrWrapper}>
            <svg
              className={styles.qrSvg}
              viewBox="0 0 160 160"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Razorpay UPI QR Code"
            >
              {/* Background */}
              <rect width="160" height="160" fill="#ffffff" rx="10" />

              {/* Corner Finder 1: Top-Left */}
              <rect x="15" y="15" width="38" height="38" fill="#0f172a" rx="4" />
              <rect x="21" y="21" width="26" height="26" fill="#ffffff" rx="2" />
              <rect x="27" y="27" width="14" height="14" fill="#8b5cf6" rx="2" />

              {/* Corner Finder 2: Top-Right */}
              <rect x="107" y="15" width="38" height="38" fill="#0f172a" rx="4" />
              <rect x="113" y="21" width="26" height="26" fill="#ffffff" rx="2" />
              <rect x="119" y="27" width="14" height="14" fill="#8b5cf6" rx="2" />

              {/* Corner Finder 3: Bottom-Left */}
              <rect x="15" y="107" width="38" height="38" fill="#0f172a" rx="4" />
              <rect x="21" y="113" width="26" height="26" fill="#ffffff" rx="2" />
              <rect x="27" y="119" width="14" height="14" fill="#8b5cf6" rx="2" />

              {/* Data Matrix Dots (Realistic QR Matrix Pattern) */}
              <g fill="#1e293b">
                <rect x="62" y="16" width="6" height="6" rx="1" />
                <rect x="74" y="16" width="6" height="6" rx="1" />
                <rect x="86" y="16" width="6" height="6" rx="1" />
                <rect x="68" y="26" width="6" height="6" rx="1" />
                <rect x="80" y="26" width="6" height="6" rx="1" />
                <rect x="62" y="36" width="6" height="6" rx="1" />
                <rect x="74" y="36" width="6" height="6" rx="1" />
                <rect x="86" y="36" width="6" height="6" rx="1" />

                <rect x="16" y="62" width="6" height="6" rx="1" />
                <rect x="28" y="62" width="6" height="6" rx="1" />
                <rect x="40" y="62" width="6" height="6" rx="1" />
                <rect x="22" y="74" width="6" height="6" rx="1" />
                <rect x="34" y="74" width="6" height="6" rx="1" />
                <rect x="16" y="86" width="6" height="6" rx="1" />
                <rect x="28" y="86" width="6" height="6" rx="1" />
                <rect x="40" y="86" width="6" height="6" rx="1" />

                <rect x="108" y="62" width="6" height="6" rx="1" />
                <rect x="120" y="62" width="6" height="6" rx="1" />
                <rect x="132" y="62" width="6" height="6" rx="1" />
                <rect x="114" y="74" width="6" height="6" rx="1" />
                <rect x="126" y="74" width="6" height="6" rx="1" />
                <rect x="138" y="74" width="6" height="6" rx="1" />
                <rect x="108" y="86" width="6" height="6" rx="1" />
                <rect x="120" y="86" width="6" height="6" rx="1" />

                <rect x="62" y="108" width="6" height="6" rx="1" />
                <rect x="74" y="108" width="6" height="6" rx="1" />
                <rect x="86" y="108" width="6" height="6" rx="1" />
                <rect x="68" y="120" width="6" height="6" rx="1" />
                <rect x="80" y="120" width="6" height="6" rx="1" />
                <rect x="62" y="132" width="6" height="6" rx="1" />
                <rect x="86" y="132" width="6" height="6" rx="1" />

                <rect x="108" y="108" width="6" height="6" rx="1" />
                <rect x="120" y="108" width="6" height="6" rx="1" />
                <rect x="132" y="108" width="6" height="6" rx="1" />
                <rect x="114" y="120" width="6" height="6" rx="1" />
                <rect x="138" y="120" width="6" height="6" rx="1" />
                <rect x="108" y="132" width="6" height="6" rx="1" />
                <rect x="126" y="132" width="6" height="6" rx="1" />
              </g>

              {/* Center Logo Pill */}
              <rect x="60" y="60" width="40" height="40" rx="8" fill="#ffffff" />
              <rect x="62" y="62" width="36" height="36" rx="6" fill="#8b5cf6" />
              <text
                x="80"
                y="85"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="12"
                fontWeight="900"
                fontFamily="sans-serif"
              >
                UPI
              </text>
            </svg>
          </div>

          <div className={styles.supportedApps}>
            <span className={styles.appsLabel}>Scan with any UPI App</span>
            <div className={styles.appPills}>
              <span className={styles.appPill}>GPay</span>
              <span className={styles.appPill}>PhonePe</span>
              <span className={styles.appPill}>Paytm</span>
              <span className={styles.appPill}>BHIM</span>
              <span className={styles.appPill}>Cred</span>
            </div>
          </div>
        </div>

        {/* UPI ID Fallback Option */}
        <div className={styles.upiIdRow}>
          <div className={styles.upiIdInfo}>
            <span className={styles.upiLabel}>Or Pay to UPI ID</span>
            <span className={styles.upiValue}>{upiId}</span>
          </div>
          <button
            type="button"
            className={styles.copyBtn}
            onClick={handleCopyUpi}
            title="Copy UPI ID"
          >
            {copiedUpi ? <Check size={14} /> : <Copy size={14} />}
            <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Security / No Card Details Assurance */}
        <div className={styles.securityNote}>
          <ShieldCheck size={16} />
          <span>
            <strong>Zero Card Details Stored:</strong> UPI payments are authorized securely via your banking app PIN. Never enter sensitive card numbers.
          </span>
        </div>
      </div>
    </Modal>
  );
}

export default UpiQrModal;
