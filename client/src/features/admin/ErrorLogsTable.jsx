import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import styles from './ErrorLogsTable.module.scss';

export function ErrorLogsTable({
  errors = [],
  total = 0,
  page = 1,
  totalPages = 1,
  isLoading = false,
  onPageChange,
}) {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusTone = (status) => {
    if (status >= 500) return 'danger';
    if (status >= 400) return 'warning';
    return 'neutral';
  };

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>System Error Telemetry</h3>
          <p className={styles.subtitle}>Recent operational and runtime errors ({total} total)</p>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Time</th>
              <th>Endpoint</th>
              <th>Status</th>
              <th>Error Message</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {errors.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.empty}>
                  {isLoading ? 'Loading error telemetry...' : 'Zero system errors recorded. All systems nominal.'}
                </td>
              </tr>
            ) : (
              errors.map((err) => {
                const isExpanded = expandedId === err._id;
                return (
                  <tr key={err._id} className={isExpanded ? styles.expandedRow : ''}>
                    <td className={styles.timeCell}>
                      {new Date(err.createdAt).toLocaleDateString()} {new Date(err.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className={styles.endpointCell}>
                      <span className={styles.methodBadge}>{err.method}</span>
                      <span className={styles.route}>{err.route}</span>
                    </td>
                    <td>
                      <Badge tone={getStatusTone(err.status)}>{err.status}</Badge>
                    </td>
                    <td className={styles.messageCell}>
                      <div className={styles.messageText}>{err.message}</div>
                    </td>
                    <td>
                      {err.stack ? (
                        <button
                          type="button"
                          className={styles.expandButton}
                          onClick={() => toggleExpand(err._id)}
                          aria-label="Toggle stack trace"
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          <span>{isExpanded ? 'Hide' : 'Trace'}</span>
                        </button>
                      ) : (
                        <span className={styles.noStack}>None</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {expandedId && (
        <div className={styles.stackPreview}>
          <div className={styles.stackHeader}>
            <AlertTriangle size={14} />
            <span>Stack Trace ({errors.find((e) => e._id === expandedId)?.route})</span>
          </div>
          <pre className={styles.stackCode}>
            {errors.find((e) => e._id === expandedId)?.stack || 'No stack trace captured.'}
          </pre>
        </div>
      )}

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
