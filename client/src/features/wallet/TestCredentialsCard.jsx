import { useState } from 'react';
import { QrCode, Copy, Check, ChevronDown, ChevronUp, ShieldCheck, Sparkles } from 'lucide-react';
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
            <QrCode size={16} />
          </div>
          <div className={styles.textGroup}>
            <span className={styles.title}>Razorpay UPI &amp; Dynamic QR Sandbox Mode</span>
            <span className={styles.subtitle}>
              Fast, card-free payments via direct UPI QR codes (GPay, PhonePe, Paytm, BHIM).
            </span>
          </div>
        </div>
        <div className={styles.toggleBtn}>
          <span className={styles.toggleLabel}>{isOpen ? 'Hide' : 'Show Guide'}</span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isOpen && (
        <div className={styles.content}>
          <div className={styles.grid}>
            {/* Dynamic QR Guide */}
            <div className={styles.credentialBox}>
              <div className={styles.boxHeader}>
                <span className={styles.boxTitle}>Dynamic UPI QR Scan</span>
              </div>
              <div className={styles.boxValueMono}>GPay / PhonePe / Paytm / BHIM</div>
              <div className={styles.cardDetailsRow}>
                <span>Scan instant on-screen QR Code directly with any mobile UPI app.</span>
              </div>
            </div>

            {/* Test UPI ID */}
            <div className={styles.credentialBox}>
              <div className={styles.boxHeader}>
                <span className={styles.boxTitle}>Sandbox Test UPI VPA</span>
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
                <span>Razorpay Test VPA — <strong>Auto-Approved</strong></span>
              </div>
            </div>

            {/* Instant Demo Feature */}
            <div className={styles.credentialBoxAccent}>
              <div className={styles.boxHeader}>
                <span className={styles.boxTitleAccent}>
                  <Sparkles size={14} />
                  1-Click UPI Verification
                </span>
              </div>
              <p className={styles.instantDesc}>
                Click <strong>&quot;⚡ Instant UPI Verification&quot;</strong> on any plan or approve inside the QR modal to test cryptographically verified HMAC ledger crediting.
              </p>
            </div>
          </div>

          <div className={styles.footerNote}>
            <ShieldCheck size={14} />
            <span>
              <strong>Zero Card Details Policy:</strong> No card numbers or banking secrets are ever requested in NexAI. Payments use direct UPI and Razorpay QR protocols.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default TestCredentialsCard;
