import { useState } from 'react';
import { Receipt, Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils/formatDate';
import styles from './TransactionTable.module.scss';

export function TransactionTable({
  transactions = [],
  pagination,
  onPageChange,
  isLoading = false,
}) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isLoading && (!transactions || transactions.length === 0)) {
    return (
      <EmptyState
        icon={<Receipt size={32} />}
        title="No billing transactions yet"
        description="Your recharge history and test-mode purchases will be recorded here."
      />
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return <Badge tone="success">Success</Badge>;
      case 'pending':
        return <Badge tone="warning">Pending</Badge>;
      case 'failed':
        return <Badge tone="danger">Failed</Badge>;
      default:
        return <Badge tone="neutral">{status || 'Unknown'}</Badge>;
    }
  };

  const getPlanLabel = (planId) => {
    switch (planId) {
      case 'starter_pack':
        return 'Starter Top-Up';
      case 'pro_pack':
        return 'Pro Developer Pack';
      case 'power_pack':
        return 'Power Studio Tier';
      default:
        return planId || 'Credit Top-Up';
    }
  };

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Package</th>
            <th>Amount</th>
            <th>Credits</th>
            <th>Status</th>
            <th>Payment ID</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx._id || tx.paymentId || tx.orderId}>
              <td className={styles.dateCell}>{formatDate(tx.createdAt)}</td>
              <td>{getPlanLabel(tx.planId)}</td>
              <td className={styles.amountCell}>₹{tx.amountINR}</td>
              <td className={styles.creditsCell}>+{tx.creditsAdded?.toLocaleString()}</td>
              <td>{getStatusBadge(tx.status)}</td>
              <td>
                <div className={styles.paymentIdCell}>
                  <span>{tx.paymentId || tx.orderId || '—'}</span>
                  {tx.paymentId && (
                    <button
                      type="button"
                      className={styles.copyBtn}
                      title="Copy Payment ID"
                      onClick={() => handleCopy(tx.paymentId)}
                    >
                      {copiedId === tx.paymentId ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {pagination && pagination.pages > 1 && (
        <div className={styles.pagination}>
          <span>
            Page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </span>
          <div className={styles.pageButtons}>
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page <= 1 || isLoading}
              onClick={() => onPageChange?.(pagination.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page >= pagination.pages || isLoading}
              onClick={() => onPageChange?.(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransactionTable;

