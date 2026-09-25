import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/lib/utils/cn';
import styles from './Toast.module.scss';

export function Toast({ id, message, tone = 'info', onDismiss }) {
  const icons = {
    success: <CheckCircle size={18} color="var(--color-success)" />,
    error: <AlertCircle size={18} color="var(--color-danger)" />,
    info: <Info size={18} color="var(--color-info)" />,
  };

  return (
    <div className={cn(styles.toast, styles[tone])} role="status">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        {icons[tone]}
        <span>{message}</span>
      </div>
      <button
        type="button"
        onClick={() => onDismiss?.(id)}
        className={styles.closeButton}
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastViewport() {
  const toasts = useUiStore((state) => state.toasts);
  const removeToast = useUiStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className={styles.viewport} aria-live="polite">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onDismiss={removeToast} />
      ))}
    </div>
  );
}
