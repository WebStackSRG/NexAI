import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Copy,
  Check,
  Star,
  Sparkles,
  Terminal,
  BookmarkPlus,
  Edit2,
  Trash2,
  Code2,
  Variable,
  Tag as TagIcon,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tag } from '@/components/ui/Tag';
import { toast } from '@/store/uiStore';
import { cn } from '@/lib/utils/cn';
import styles from './PromptDetailModal.module.scss';

export function PromptDetailModal({
  open,
  onClose,
  prompt,
  onUse,
  onEdit,
  onDelete,
  onToggleFavorite,
  onClone,
}) {
  const [copied, setCopied] = useState(false);

  if (!prompt) return null;

  const isStarter = Boolean(prompt.isStarter);
  const variables = prompt.variables || [];
  const tags = prompt.tags || [];

  const handleCopyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(prompt.template);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Prompt template copied to clipboard');
    } catch {
      toast.error('Failed to copy template');
    }
  };

  const handleUsePrompt = () => {
    onClose?.();
    onUse?.(prompt);
  };

  const handleClonePrompt = () => {
    onClone?.(prompt);
  };

  const handleEditPrompt = () => {
    onClose?.();
    onEdit?.(prompt);
  };

  const handleDeletePrompt = () => {
    onClose?.();
    onDelete?.(prompt);
  };

  // Helper to render template with highlighted variable syntax
  const renderHighlightedTemplate = (text) => {
    const parts = text.split(/(\{\{\s*[a-zA-Z0-9_]+\s*\}\})/g);
    return parts.map((part, index) => {
      if (/^\{\{\s*[a-zA-Z0-9_]+\s*\}\}$/.test(part)) {
        return (
          <span key={index} className={styles.varHighlight}>
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className={styles.modalTitleRow}>
          <div className={styles.titleWithIcon}>
            {isStarter ? (
              <span className={styles.starterIcon} title="Curated Starter Template">
                <Sparkles size={18} />
              </span>
            ) : (
              <button
                type="button"
                className={cn(styles.starBtn, prompt.isFavorite && styles.isFavorite)}
                onClick={() => onToggleFavorite?.(prompt._id)}
                title={prompt.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
                aria-label={prompt.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
              >
                <Star size={18} fill={prompt.isFavorite ? 'currentColor' : 'none'} />
              </button>
            )}
            <span className={styles.titleText}>{prompt.title}</span>
          </div>
        </div>
      }
      className={styles.modalContent}
      footer={
        <div className={styles.footerRow}>
          <div className={styles.footerLeft}>
            {isStarter && onClone && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<BookmarkPlus size={15} />}
                onClick={handleClonePrompt}
              >
                Save to My Vault
              </Button>
            )}
            {!isStarter && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Edit2 size={14} />}
                onClick={handleEditPrompt}
              >
                Edit
              </Button>
            )}
            {!isStarter && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Trash2 size={14} />}
                onClick={handleDeletePrompt}
                className={styles.deleteBtn}
              >
                Delete
              </Button>
            )}
          </div>

          <div className={styles.footerRight}>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={copied ? <Check size={14} /> : <Copy size={14} />}
              onClick={handleCopyTemplate}
            >
              {copied ? 'Copied' : 'Copy Template'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Terminal size={15} />}
              onClick={handleUsePrompt}
            >
              Use Prompt
            </Button>
          </div>
        </div>
      }
    >
      <div className={styles.bodyContainer}>
        {/* Badges metadata bar */}
        <div className={styles.metaRow}>
          {isStarter && <Badge tone="accent">Curated Template</Badge>}
          {prompt.category && <Badge tone="neutral">{prompt.category}</Badge>}
          {variables.length > 0 ? (
            <Badge tone="accent">
              {variables.length} {variables.length === 1 ? 'variable' : 'variables'}
            </Badge>
          ) : (
            <Badge tone="neutral">Static prompt</Badge>
          )}
        </div>

        {/* Description */}
        {prompt.description && (
          <div className={styles.descriptionBlock}>
            <p className={styles.description}>{prompt.description}</p>
          </div>
        )}

        {/* Variables List if any */}
        {variables.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <Variable size={14} className={styles.sectionIcon} />
              <span className={styles.sectionTitle}>Variables</span>
              <span className={styles.variableNotice}>Fillable when using this prompt</span>
            </div>
            <div className={styles.variablePills}>
              {variables.map((v) => (
                <span key={v} className={styles.varPill}>
                  {`{{${v}}}`}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Template Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Code2 size={14} className={styles.sectionIcon} />
            <span className={styles.sectionTitle}>Prompt Template</span>
            <button
              type="button"
              className={styles.copyInlineBtn}
              onClick={handleCopyTemplate}
              aria-label="Copy prompt template"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className={styles.templateBox}>
            <pre className={styles.templateCode}>
              {renderHighlightedTemplate(prompt.template)}
            </pre>
          </div>
        </div>

        {/* Tags if any */}
        {tags.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <TagIcon size={14} className={styles.sectionIcon} />
              <span className={styles.sectionTitle}>Tags</span>
            </div>
            <div className={styles.tagsRow}>
              {tags.map((tag) => (
                <Tag key={tag} label={`#${tag}`} size="sm" />
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

PromptDetailModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  prompt: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    template: PropTypes.string.isRequired,
    variables: PropTypes.arrayOf(PropTypes.string),
    tags: PropTypes.arrayOf(PropTypes.string),
    category: PropTypes.string,
    isFavorite: PropTypes.bool,
    isStarter: PropTypes.bool,
  }),
  onUse: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onToggleFavorite: PropTypes.func,
  onClone: PropTypes.func,
};
