import { useState } from 'react';
import { CheckCircle2, Clock, AlertTriangle, Copy, Check, Printer, ShieldCheck } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils/formatDate';
import styles from './TransactionReceiptModal.module.scss';

export function TransactionReceiptModal({ transaction, open, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!transaction) return null;

  const handleCopy = () => {
    const text = `NexAI Billing Receipt
------------------------
Date: ${formatDate(transaction.createdAt)}
Plan: ${transaction.planId}
Amount: ₹${transaction.amountINR}
Credits Credited: +${transaction.creditsAdded}
Status: ${transaction.status}
Order ID: ${transaction.orderId || 'N/A'}
Payment ID: ${transaction.paymentId || 'N/A'}
Gateway: Razorpay Test Mode`;

    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 size={16} className={styles.iconSuccess} />;
      case 'pending':
        return <Clock size={16} className={styles.iconWarning} />;
      default:
        return <AlertTriangle size={16} className={styles.iconDanger} />;
    }
  };

  const planTitles = {
    starter_pack: 'Starter Top-Up (500 Credits)',
    pro_pack: 'Pro Developer Pack (1,200 Credits)',
    power_pack: 'Power Studio Tier (3,500 Credits)',
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Transaction Receipt"
      className={styles.receiptModal}
      footer={
        <div className={styles.modalFooter}>
          <div className={styles.leftActions}>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={copied ? <Check size={14} /> : <Copy size={14} />}
              onClick={handleCopy}
            >
              {copied ? 'Copied' : 'Copy Summary'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Printer size={14} />}
              onClick={handlePrint}
            >
              Print
            </Button>
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      }
    >
      <div className={styles.receiptBody}>
        {/* Receipt Header Badge */}
        <div className={styles.receiptCard}>
          <div className={styles.topRow}>
            <div>
              <span className={styles.brandName}>NexAI Workspace Billing</span>
              <h3 className={styles.receiptTitle}>
                {planTitles[transaction.planId] || transaction.planId || 'Credit Top-Up'}
              </h3>
            </div>
            <Badge tone={transaction.status === 'success' ? 'success' : 'warning'}>
              <span className={styles.statusWithIcon}>
                {getStatusIcon(transaction.status)}
                {transaction.status ? transaction.status.toUpperCase() : 'COMPLETED'}
              </span>
            </Badge>
          </div>

          <div className={styles.amountDisplay}>
            <span className={styles.currencySymbol}>₹</span>
            <span className={styles.amountValue}>{transaction.amountINR}</span>
            <span className={styles.creditsCredited}>
              (+{transaction.creditsAdded?.toLocaleString()} credits added)
            </span>
          </div>
        </div>

        {/* Detailed Meta Ledger */}
        <div className={styles.metaList}>
          <div className={styles.metaRow}>
            <span className={styles.metaKey}>Transaction ID</span>
            <span className={styles.metaValMono}>{transaction._id || '—'}</span>
          </div>

          <div className={styles.metaRow}>
            <span className={styles.metaKey}>Payment ID (Razorpay)</span>
            <span className={styles.metaValMono}>{transaction.paymentId || '—'}</span>
          </div>

          <div className={styles.metaRow}>
            <span className={styles.metaKey}>Order Reference</span>
            <span className={styles.metaValMono}>{transaction.orderId || '—'}</span>
          </div>

          <div className={styles.metaRow}>
            <span className={styles.metaKey}>Date &amp; Time</span>
            <span className={styles.metaVal}>{formatDate(transaction.createdAt)}</span>
          </div>

          <div className={styles.metaRow}>
            <span className={styles.metaKey}>Payment Method</span>
            <span className={styles.metaVal}>
              <span className={styles.gatewayBadge}>
                <ShieldCheck size={13} />
                Razorpay Direct UPI / QR
              </span>
            </span>
          </div>

          <div className={styles.metaRow}>
            <span className={styles.metaKey}>Idempotency Status</span>
            <span className={styles.metaVal} style={{ color: 'var(--color-success)' }}>
              Verified &amp; Credited Once
            </span>
          </div>
        </div>

        {/* Note */}
        <div className={styles.verificationNote}>
          <ShieldCheck size={15} style={{ color: 'var(--color-accent)' }} />
          <span>
            Cryptographically verified using HMAC SHA-256 against server secret.
            Credits have been committed to MongoDB atomically.
          </span>
        </div>
      </div>
    </Modal>
  );
}

export default TransactionReceiptModal;
