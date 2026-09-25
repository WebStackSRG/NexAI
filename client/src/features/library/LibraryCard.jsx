import { Globe, FileText, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils/formatDate';
import { cn } from '@/lib/utils/cn';
import styles from './LibraryCard.module.scss';

export function LibraryCard({ item, onEdit, onDelete, onTagClick, activeTag }) {
  const isLink = item.type === 'link';

  let hostname = '';
  if (isLink && item.url) {
    try {
      hostname = new URL(item.url).hostname.replace(/^www\./, '');
    } catch {
      hostname = '';
    }
  }

  return (
    <Card className={styles.cardWrapper} padding="md">
      <Card.Header className={styles.header}>
        <div className={styles.typeMeta}>
          <div className={styles.typeIcon} title={isLink ? 'Web Link' : 'Personal Note'}>
            {isLink ? <Globe size={15} /> : <FileText size={15} />}
          </div>
          <span className={styles.dateText}>{formatDate(item.createdAt)}</span>
        </div>

        <div className={styles.actions}>
          {isLink && item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.actionBtn}
              aria-label="Open original link in new tab"
              title="Open link"
            >
              <ExternalLink size={14} />
            </a>
          )}
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => onEdit(item)}
            aria-label="Edit item"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            className={cn(styles.actionBtn, styles.deleteBtn)}
            onClick={() => onDelete(item)}
            aria-label="Delete item"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </Card.Header>

      <Card.Body className={styles.body}>
        <h3 className={styles.title} title={item.title}>
          {item.title}
        </h3>

        {item.summary && (
          <p className={styles.summary} title={item.summary}>
            {item.summary}
          </p>
        )}

        {hostname && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.sourceDomain}
          >
            <Globe size={12} />
            <span>{hostname}</span>
          </a>
        )}
      </Card.Body>

      {item.tags && item.tags.length > 0 && (
        <Card.Footer className={styles.footer}>
          {item.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={cn(styles.tagChip, activeTag === tag && styles.activeTag)}
              onClick={() => onTagClick?.(tag)}
            >
              #{tag}
            </button>
          ))}
        </Card.Footer>
      )}
    </Card>
  );
}
