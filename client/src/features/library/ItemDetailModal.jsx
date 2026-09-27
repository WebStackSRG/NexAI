import { useState, useEffect } from 'react';
import {
  FileText,
  Globe,
  BookOpen,
  Paperclip,
  Mic,
  Copy,
  Check,
  ExternalLink,
  Download,
  Trash2,
  Edit3,
  Eye,
  Sparkles,
  Calendar,
  Plus,
  X,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { TagInput } from '@/components/ui/TagInput';
import { NoteEditor } from './NoteEditor';
import { MarkdownRenderer } from '@/features/chat/MarkdownRenderer';
import { useLibraryStore } from '@/store/libraryStore';
import { formatDate } from '@/lib/utils/formatDate';
import { toast } from '@/store/uiStore';
import { cn } from '@/lib/utils/cn';
import styles from './ItemDetailModal.module.scss';

function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function ItemDetailModal() {
  const {
    isViewItemModalOpen,
    viewingItem,
    closeViewItemModal,
    updateItem,
    isUpdating,
    openDeleteDialog,
    exportPdf,
    isExportingPdf,
    setActiveTag,
  } = useLibraryStore();

  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form states for editing
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState([]);
  const [editSections, setEditSections] = useState([]);
  const [editError, setEditError] = useState('');

  // Sync state whenever viewingItem changes or edit mode opened
  useEffect(() => {
    if (viewingItem) {
      setEditTitle(viewingItem.title || '');
      setEditSummary(viewingItem.summary || '');
      setEditContent(viewingItem.content || '');
      setEditTags(viewingItem.tags || []);
      setEditSections(
        viewingItem.sections ? JSON.parse(JSON.stringify(viewingItem.sections)) : [],
      );
      setEditError('');
      setIsEditing(false);
      setCopied(false);
    }
  }, [viewingItem]);

  if (!isViewItemModalOpen || !viewingItem) return null;

  const isNote = viewingItem.type === 'note';
  const isLink = viewingItem.type === 'link';
  const isDoc = viewingItem.type === 'document';
  const isFile = viewingItem.type === 'file';
  const isInterview = viewingItem.type === 'interview';

  const getTypeMeta = () => {
    switch (viewingItem.type) {
      case 'note':
        return { label: 'Personal Note', icon: <FileText size={14} />, class: styles.note };
      case 'link':
        return { label: 'Web Link', icon: <Globe size={14} />, class: styles.link };
      case 'document':
        return {
          label: `Document (${viewingItem.category || 'General'})`,
          icon: <BookOpen size={14} />,
          class: styles.document,
        };
      case 'file':
        return { label: 'File Asset', icon: <Paperclip size={14} />, class: styles.file };
      case 'interview':
        return { label: 'Mock Interview', icon: <Mic size={14} />, class: styles.interview };
      default:
        return { label: 'Library Item', icon: <FileText size={14} />, class: styles.note };
    }
  };

  const typeMeta = getTypeMeta();

  const handleCopy = async () => {
    try {
      const textToCopy =
        viewingItem.content ||
        viewingItem.url ||
        (Array.isArray(viewingItem.sections)
          ? viewingItem.sections.map((s) => `## ${s.heading}\n\n${s.body}`).join('\n\n')
          : viewingItem.summary || viewingItem.title);

      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!editTitle.trim()) {
      setEditError('Title is required');
      return;
    }
    setEditError('');

    try {
      await updateItem(viewingItem._id, {
        title: editTitle.trim(),
        summary: editSummary.trim(),
        content: editContent,
        tags: editTags,
        sections: isDoc ? editSections : undefined,
      });
      setIsEditing(false);
    } catch {
      // Store already shows toast error
    }
  };

  const handleAddSection = () => {
    setEditSections((prev) => [
      ...prev,
      { heading: `Section ${prev.length + 1}`, body: '' },
    ]);
  };

  const handleRemoveSection = (idx) => {
    setEditSections((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSectionChange = (idx, field, val) => {
    setEditSections((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleDelete = () => {
    closeViewItemModal();
    openDeleteDialog(viewingItem);
  };

  const handleTagClick = (tag) => {
    closeViewItemModal();
    setActiveTag(tag);
  };

  return (
    <Modal
      open={isViewItemModalOpen}
      onClose={closeViewItemModal}
      className={styles.modalWrapper}
      title={
        <div className={styles.modalHeader}>
          <span className={cn(styles.typeBadge, typeMeta.class)}>
            {typeMeta.icon}
            <span>{typeMeta.label}</span>
          </span>
        </div>
      }
    >
      {/* Top Action Toolbar */}
      <div className={styles.actionToolbar}>
        <div className={styles.toolbarLeft}>
          <div className={styles.modeToggle} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={!isEditing}
              className={cn(styles.modeBtn, !isEditing && styles.active)}
              onClick={() => setIsEditing(false)}
            >
              <Eye size={13} />
              <span>Details</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isEditing}
              className={cn(styles.modeBtn, isEditing && styles.active)}
              onClick={() => setIsEditing(true)}
            >
              <Edit3 size={13} />
              <span>Edit</span>
            </button>
          </div>
        </div>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={styles.toolActionBtn}
            onClick={handleCopy}
            title="Copy content"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {isDoc && (
            <button
              type="button"
              className={styles.toolActionBtn}
              onClick={() => exportPdf(viewingItem)}
              disabled={isExportingPdf}
              title="Download PDF document"
            >
              <Download size={13} />
              <span>{isExportingPdf ? 'Exporting...' : 'PDF'}</span>
            </button>
          )}

          {isLink && viewingItem.url && (
            <a
              href={viewingItem.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.toolActionBtn}
              title="Open link in new tab"
            >
              <ExternalLink size={13} />
              <span>Visit Link</span>
            </a>
          )}

          <button
            type="button"
            className={cn(styles.toolActionBtn, styles.danger)}
            onClick={handleDelete}
            title="Delete this item"
          >
            <Trash2 size={13} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {!isEditing ? (
        /* ======================== VIEW MODE ======================== */
        <div className={styles.viewContainer}>
          <div className={styles.headerSection}>
            <div className={styles.titleRow}>
              <h1 className={styles.itemTitle}>{viewingItem.title}</h1>
            </div>

            <div className={styles.metaRow}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={13} />
                {formatDate(viewingItem.createdAt)}
              </span>

              {isDoc && viewingItem.category && (
                <Badge variant="accent" size="sm">
                  {viewingItem.category.toUpperCase()}
                </Badge>
              )}

              {isFile && viewingItem.size > 0 && (
                <Badge variant="secondary" size="sm">
                  {formatFileSize(viewingItem.size)}
                </Badge>
              )}

              {isInterview && viewingItem.scorecard?.overallScore !== undefined && (
                <Badge variant="success" size="sm">
                  Score: {viewingItem.scorecard.overallScore}/100
                </Badge>
              )}
            </div>

            {/* AI Summary Banner */}
            {viewingItem.summary && (
              <div className={styles.summaryBox}>
                <div className={styles.summaryHeader}>
                  <Sparkles size={13} />
                  <span>Key Summary</span>
                </div>
                <p>{viewingItem.summary}</p>
              </div>
            )}

            {/* Tags */}
            {Array.isArray(viewingItem.tags) && viewingItem.tags.length > 0 && (
              <div className={styles.tagsContainer}>
                {viewingItem.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={styles.tagChip}
                    onClick={() => handleTagClick(tag)}
                    title={`Filter by #${tag}`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Type-Specific Content Displays */}
          {isNote && (
            <div className={styles.contentBlock}>
              <div className={styles.contentHeader}>
                <span>Note Content</span>
                <span>
                  {viewingItem.content ? `${viewingItem.content.length} chars` : 'Empty note'}
                </span>
              </div>
              {viewingItem.content ? (
                <MarkdownRenderer content={viewingItem.content} />
              ) : (
                <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', margin: 0 }}>
                  This note does not have detailed body content yet. Click &ldquo;Edit&rdquo; above to
                  write with the interactive markdown editor.
                </p>
              )}
            </div>
          )}

          {isDoc && (
            <div className={styles.contentBlock}>
              {Array.isArray(viewingItem.sections) && viewingItem.sections.length > 0 ? (
                viewingItem.sections.map((sec, idx) => (
                  <div key={idx} className={styles.sectionBlock}>
                    <h2 className={styles.sectionHeading}>{sec.heading}</h2>
                    <MarkdownRenderer content={sec.body || ''} />
                  </div>
                ))
              ) : viewingItem.content ? (
                <MarkdownRenderer content={viewingItem.content} />
              ) : (
                <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  No sections generated for this document.
                </p>
              )}
            </div>
          )}

          {isLink && (
            <div className={styles.linkPreviewBox}>
              <div className={styles.linkInfo}>
                <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>
                  Web Link Destination
                </span>
                <span className={styles.linkUrl}>{viewingItem.url}</span>
              </div>
              <a
                href={viewingItem.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.toolActionBtn}
              >
                <ExternalLink size={13} />
                <span>Visit Page</span>
              </a>
            </div>
          )}

          {isFile && (
            <div className={styles.contentBlock}>
              <div className={styles.contentHeader}>
                <span>File Metadata</span>
                <span>{formatFileSize(viewingItem.size)}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 'var(--text-sm)' }}>
                <div><strong>File Name:</strong> {viewingItem.fileName || 'Unnamed File'}</div>
                {viewingItem.mimeType && <div><strong>MIME Type:</strong> {viewingItem.mimeType}</div>}
              </div>
              {viewingItem.content && (
                <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border)' }}>
                  <MarkdownRenderer content={viewingItem.content} />
                </div>
              )}
            </div>
          )}

          {isInterview && viewingItem.scorecard && (
            <div className={styles.scorecardBox}>
              <div className={styles.scoreOverview}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)' }}>
                    Interview Scorecard
                  </h3>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    {viewingItem.role ? `${viewingItem.role} • ` : ''}
                    {viewingItem.difficulty || 'Standard'} difficulty
                  </div>
                </div>
                <div className={styles.scorePill}>
                  {viewingItem.scorecard.overallScore}/100
                </div>
              </div>
              {viewingItem.scorecard.feedback && (
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  {viewingItem.scorecard.feedback}
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ======================== EDIT MODE ======================== */
        <form onSubmit={handleSave} className={styles.editContainer}>
          {editError && (
            <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)', padding: 'var(--space-2)', background: 'color-mix(in srgb, var(--color-danger) 10%, transparent)', borderRadius: 'var(--radius-sm)' }}>
              {editError}
            </div>
          )}

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Title</label>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Item title..."
              autoFocus
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Summary</label>
            <Textarea
              value={editSummary}
              onChange={(e) => setEditSummary(e.target.value)}
              placeholder="Concise summary or description..."
              rows={3}
            />
          </div>

          {/* Interactive Note Editor for notes */}
          {isNote && (
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Note Content (Interactive Markdown)</label>
              <NoteEditor
                value={editContent}
                onChange={setEditContent}
                placeholder="Write your note in rich markdown..."
                minHeight={260}
              />
            </div>
          )}

          {/* Document Section Editor */}
          {isDoc && (
            <div className={styles.formField}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className={styles.fieldLabel}>Document Sections</label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddSection}
                  leftIcon={<Plus size={13} />}
                >
                  Add Section
                </Button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {editSections.map((sec, idx) => (
                  <div key={idx} className={styles.sectionEditCard}>
                    <div className={styles.sectionEditHeader}>
                      <span className={styles.sectionIndexBadge}>Section {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(idx)}
                        style={{ border: 'none', background: 'transparent', color: 'var(--color-danger)', cursor: 'pointer' }}
                        title="Remove section"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <Input
                      value={sec.heading}
                      onChange={(e) => handleSectionChange(idx, 'heading', e.target.value)}
                      placeholder="Section heading..."
                    />
                    <Textarea
                      value={sec.body}
                      onChange={(e) => handleSectionChange(idx, 'body', e.target.value)}
                      placeholder="Section markdown content..."
                      rows={4}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* For other types with raw content */}
          {(isFile || isLink) && (
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Additional Content</label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Content details or notes..."
                rows={4}
              />
            </div>
          )}

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Tags</label>
            <TagInput
              tags={editTags}
              onChange={setEditTags}
              placeholder="Type tag and press Enter..."
            />
          </div>

          <div className={styles.editActions}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditing(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isUpdating}>
              Save Changes
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
