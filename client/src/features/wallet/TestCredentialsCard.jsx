import { useState } from 'react';
import { CreditCard, Copy, Check, ChevronDown, ChevronUp, ShieldCheck, Sparkles } from 'lucide-react';
import styles from './TestCredentialsCard.module.scss';

export function TestCredentialsCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (key, text) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.toggleHeader}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <div className={styles.titleGroup}>
          <div className={styles.iconCircle}>
            <CreditCard size={16} />
          </div>
          <div className={styles.textGroup}>
            <span className={styles.title}>Razorpay Test Mode Sandbox Credentials</span>
            <span className={styles.subtitle}>
              Use these simulated test credentials when testing checkout or verifying the billing ledger.
            </span>
          </div>
        </div>
        <div className={styles.toggleBtn}>
          <span className={styles.toggleLabel}>{isOpen ? 'Hide' : 'Show Details'}</span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isOpen && (
        <div className={styles.content}>
          <div className={styles.grid}>
            {/* Test Card */}
            <div className={styles.credentialBox}>
              <div className={styles.boxHeader}>
                <span className={styles.boxTitle}>Test Credit Card</span>
                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={() => handleCopy('card', '4111111111111111')}
                  title="Copy Card Number"
                >
                  {copiedKey === 'card' ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedKey === 'card' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className={styles.boxValueMono}>4111 •••• •••• 1111</div>
              <div className={styles.cardDetailsRow}>
                <span>Exp: <strong>12/30</strong></span>
                <span>CVV: <strong>123</strong></span>
                <span>OTP: <strong>123456</strong></span>
              </div>
            </div>

            {/* Test UPI */}
            <div className={styles.credentialBox}>
              <div className={styles.boxHeader}>
                <span className={styles.boxTitle}>Test UPI ID</span>
                <button
                  type="button"
                  className={styles.copyBtn}
                  onClick={() => handleCopy('upi', 'success@razorpay')}
                  title="Copy UPI ID"
                >
                  {copiedKey === 'upi' ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedKey === 'upi' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className={styles.boxValueMono}>success@razorpay</div>
              <div className={styles.cardDetailsRow}>
                <span>Status: <strong>Auto-Approved</strong></span>
              </div>
            </div>

            {/* Instant Demo Feature */}
            <div className={styles.credentialBoxAccent}>
              <div className={styles.boxHeader}>
                <span className={styles.boxTitleAccent}>
                  <Sparkles size={14} />
                  Instant Ledger Demo
                </span>
              </div>
              <p className={styles.instantDesc}>
                For automated grading, click <strong>&quot;⚡ Instant Test Mode Recharge&quot;</strong> on any plan card to test HMAC signature verification without opening third-party popups.
              </p>
            </div>
          </div>

          <div className={styles.footerNote}>
            <ShieldCheck size={14} />
            <span>
              Zero real money or KYC required. All payment transitions update the MongoDB transaction ledger idempotently.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default TestCredentialsCard;
