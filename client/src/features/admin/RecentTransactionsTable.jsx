import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import styles from './RecentTransactionsTable.module.scss';

export function RecentTransactionsTable({
  transactions = [],
  total = 0,
  page = 1,
  totalPages = 1,
  isLoading = false,
  onPageChange,
}) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return (
          <Badge tone="success">
            <CheckCircle2 size={12} style={{ marginRight: 4 }} />
            Completed
          </Badge>
        );
      case 'pending':
        return (
          <Badge tone="warning">
            <Clock size={12} style={{ marginRight: 4 }} />
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge tone="danger">
            <AlertCircle size={12} style={{ marginRight: 4 }} />
            Failed
          </Badge>
        );
      default:
        return <Badge tone="neutral">{status}</Badge>;
    }
  };

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Platform Recharges</h3>
          <p className={styles.subtitle}>Recent Razorpay transactions and credit top-ups ({total} total)</p>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>User</th>
              <th>Order ID</th>
              <th>Amount</th>
              <th>Credits</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.empty}>
                  {isLoading ? 'Loading transactions...' : 'No transactions recorded yet.'}
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx._id}>
                  <td className={styles.dateCell}>
                    {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className={styles.userCell}>{tx.userId?.email || 'Unknown User'}</td>
                  <td className={styles.orderCell}>{tx.orderId || tx.paymentId || '—'}</td>
                  <td className={styles.amountCell}>₹{tx.amountINR}</td>
                  <td className={styles.creditsCell}>+{tx.creditsAdded}</td>
                  <td>{getStatusBadge(tx.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>
            Page {page} of {totalPages}
          </span>
          <div className={styles.pageActions}>
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => onPageChange?.(page - 1)}
            >
              <ChevronLeft size={16} />
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages || isLoading}
              onClick={() => onPageChange?.(page + 1)}
            >
              Next
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
