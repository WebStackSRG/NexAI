import PropTypes from 'prop-types';
import {
  Globe,
  FileText,
  ExternalLink,
  Pencil,
  Trash2,
  Download,
  BookOpen,
  Paperclip,
  Mic,
  Eye,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils/formatDate';
import { cn } from '@/lib/utils/cn';
import styles from './LibraryCard.module.scss';

function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function LibraryCard({
  item,
  onEdit,
  onDelete,
  onTagClick,
  activeTag,
  onViewDoc,
  onExportPdf,
}) {
  const isLink = item.type === 'link';
  const isDoc = item.type === 'document';
  const isFile = item.type === 'file';
  const isInterview = item.type === 'interview';

  let hostname = '';
  if (isLink && item.url) {
    try {
      hostname = new URL(item.url).hostname.replace(/^www\./, '');
    } catch {
      hostname = '';
    }
  }

  const renderTypeIcon = () => {
    switch (item.type) {
      case 'link':
        return <Globe size={15} />;
      case 'document':
        return <BookOpen size={15} />;
      case 'file':
        return <Paperclip size={15} />;
      case 'interview':
        return <Mic size={15} />;
      case 'note':
      default:
        return <FileText size={15} />;
    }
  };

  const getTypeTitle = () => {
    switch (item.type) {
      case 'link':
        return 'Web Link';
      case 'document':
        return `Document (${item.category || 'general'})`;
      case 'file':
        return `File (${item.fileName || 'custom'})`;
      case 'interview':
        return 'Mock Interview';
      case 'note':
      default:
        return 'Personal Note';
    }
  };

  return (
    <Card className={styles.cardWrapper} padding="md">
      <Card.Header className={styles.header}>
        <div className={styles.typeMeta}>
          <div className={cn(styles.typeIcon, styles[item.type])} title={getTypeTitle()}>
            {renderTypeIcon()}
          </div>
          <span className={styles.dateText}>{formatDate(item.createdAt)}</span>
          {isDoc && item.category && (
            <Badge variant="accent" size="sm" className={styles.categoryBadge}>
              {item.category.toUpperCase()}
            </Badge>
          )}
          {isFile && item.size > 0 && (
            <span className={styles.sizeBadge}>{formatFileSize(item.size)}</span>
          )}
          {isInterview && item.scorecard?.overallScore !== undefined && (
            <Badge variant="success" size="sm">
              {item.scorecard.overallScore}/100
            </Badge>
          )}
        </div>

        <div className={styles.actions}>
          {isDoc && (
            <>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => onViewDoc?.(item)}
                aria-label="View document"
                title="View Document"
              >
                <Eye size={14} />
              </button>
              <button
                type="button"
                className={cn(styles.actionBtn, styles.exportBtn)}
                onClick={() => onExportPdf?.(item)}
                aria-label="Export to PDF"
                title="Download PDF"
              >
                <Download size={14} />
              </button>
            </>
          )}

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
        <h3
          className={cn(styles.title, isDoc && styles.clickableTitle)}
          title={item.title}
          onClick={isDoc ? () => onViewDoc?.(item) : undefined}
        >
          {item.title}
        </h3>

        {item.summary && (
          <p className={styles.summary} title={item.summary}>
            {item.summary}
          </p>
        )}

        {isDoc && Array.isArray(item.sections) && item.sections.length > 0 && (
          <div className={styles.docStats}>
            <span className={styles.sectionCount}>
              {item.sections.length} {item.sections.length === 1 ? 'section' : 'sections'}
            </span>
            <span className={styles.docHeadings}>
              {item.sections
                .slice(0, 3)
                .map((s) => s.heading)
                .join(' · ')}
              {item.sections.length > 3 ? '...' : ''}
            </span>
          </div>
        )}

        {isFile && item.fileName && (
          <div className={styles.fileDetail}>
            <Paperclip size={12} />
            <span className={styles.fileName}>{item.fileName}</span>
          </div>
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

LibraryCard.propTypes = {
  item: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['link', 'note', 'document', 'file', 'interview']).isRequired,
    title: PropTypes.string.isRequired,
    summary: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    url: PropTypes.string,
    category: PropTypes.string,
    sections: PropTypes.arrayOf(
      PropTypes.shape({
        heading: PropTypes.string,
        body: PropTypes.string,
      }),
    ),
    fileName: PropTypes.string,
    size: PropTypes.number,
    scorecard: PropTypes.object,
    createdAt: PropTypes.string,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onTagClick: PropTypes.func,
  activeTag: PropTypes.string,
  onViewDoc: PropTypes.func,
  onExportPdf: PropTypes.func,
};
