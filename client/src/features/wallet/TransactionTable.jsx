import { useState, useMemo } from 'react';
import { Receipt, Copy, Check, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils/formatDate';
import { TransactionReceiptModal } from './TransactionReceiptModal';
import styles from './TransactionTable.module.scss';

export function TransactionTable({
  transactions = [],
  pagination,
  onPageChange,
  isLoading = false,
}) {
  const [copiedId, setCopiedId] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const handleCopy = (e, text) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

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

  const filteredTransactions = useMemo(() => {
    if (statusFilter === 'all') return transactions;
    return transactions.filter((tx) => tx.status === statusFilter);
  }, [transactions, statusFilter]);

  if (!isLoading && (!transactions || transactions.length === 0)) {
    return (
      <EmptyState
        icon={<Receipt size={32} />}
        title="No billing transactions yet"
        description="Your recharge history and test-mode purchases will be recorded here."
      />
    );
  }

  return (
    <div className={styles.tableWrapper}>
      {/* Filter Tabs */}
      <div className={styles.filterRow}>
        <div className={styles.filterButtons}>
          <button
            type="button"
            className={`${styles.filterBtn} ${statusFilter === 'all' ? styles.active : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All ({transactions.length})
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${statusFilter === 'success' ? styles.active : ''}`}
            onClick={() => setStatusFilter('success')}
          >
            Success ({transactions.filter((t) => t.status === 'success').length})
          </button>
          {transactions.some((t) => t.status === 'pending') && (
            <button
              type="button"
              className={`${styles.filterBtn} ${statusFilter === 'pending' ? styles.active : ''}`}
              onClick={() => setStatusFilter('pending')}
            >
              Pending ({transactions.filter((t) => t.status === 'pending').length})
            </button>
          )}
        </div>
        <span className={styles.hint}>Click row to view receipt</span>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Package</th>
            <th>Amount</th>
            <th>Credits</th>
            <th>Status</th>
            <th>Payment ID</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            // Loading Skeletons (Rule 13)
            Array.from({ length: 4 }).map((_, i) => (
              <tr key={`skel-${i}`} className={styles.skeletonRow}>
                <td><Skeleton style={{ height: 16, width: 80 }} /></td>
                <td><Skeleton style={{ height: 16, width: 120 }} /></td>
                <td><Skeleton style={{ height: 16, width: 45 }} /></td>
                <td><Skeleton style={{ height: 16, width: 60 }} /></td>
                <td><Skeleton style={{ height: 20, width: 65, borderRadius: 12 }} /></td>
                <td><Skeleton style={{ height: 16, width: 140 }} /></td>
                <td style={{ textAlign: 'right' }}><Skeleton style={{ height: 24, width: 24, borderRadius: 4, display: 'inline-block' }} /></td>
              </tr>
            ))
          ) : filteredTransactions.length === 0 ? (
            <tr>
              <td colSpan={7} className={styles.noFilterMatches}>
                No transactions matching &quot;{statusFilter}&quot;
              </td>
            </tr>
          ) : (
            filteredTransactions.map((tx) => (
              <tr
                key={tx._id || tx.paymentId || tx.orderId}
                className={styles.clickableRow}
                onClick={() => setSelectedTx(tx)}
                title="Click to view full receipt"
              >
                <td className={styles.dateCell}>{formatDate(tx.createdAt)}</td>
                <td className={styles.planCell}>{getPlanLabel(tx.planId)}</td>
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
                        onClick={(e) => handleCopy(e, tx.paymentId)}
                      >
                        {copiedId === tx.paymentId ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    )}
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={styles.viewReceiptBtn}
                    leftIcon={<FileText size={13} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTx(tx);
                    }}
                  >
                    Receipt
                  </Button>
                </td>
              </tr>
            ))
          )}
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

      {/* Detailed Receipt Modal */}
      <TransactionReceiptModal
        open={Boolean(selectedTx)}
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
}

export default TransactionTable;
