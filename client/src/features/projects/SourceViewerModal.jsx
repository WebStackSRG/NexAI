import PropTypes from 'prop-types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import styles from './SourceViewerModal.module.scss';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function SourceViewerModal({ open, onClose, source }) {
  if (!source) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={source.name || 'Source File Preview'}
    >
      <div className={styles.modalBody}>
        <div className={styles.metaRow}>
          <div className={styles.metaTags}>
            <span className={styles.badge}>{source.mimeType || 'text'}</span>
            <span>{formatBytes(source.size)}</span>
          </div>
          <span>
            Added {new Date(source.createdAt || Date.now()).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>

        <div className={styles.contentBox}>
          {source.content ? (
            <pre className={styles.contentText}>{source.content}</pre>
          ) : (
            <div className={styles.emptyContent}>No preview text available for this file.</div>
          )}
        </div>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

SourceViewerModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  source: PropTypes.object,
};
