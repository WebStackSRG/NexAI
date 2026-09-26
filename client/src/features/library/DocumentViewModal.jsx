import { useState } from 'react';
import { BookOpen, Download, Pencil, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { MarkdownRenderer } from '@/features/chat/MarkdownRenderer';
import { useLibraryStore } from '@/store/libraryStore';
import { formatDate } from '@/lib/utils/formatDate';
import styles from './DocumentViewModal.module.scss';

export function DocumentViewModal() {
  const {
    isViewDocModalOpen,
    viewingDoc,
    closeViewDocModal,
    exportPdf,
    isExportingPdf,
    updateItem,
    isUpdating,
  } = useLibraryStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editSections, setEditSections] = useState([]);

  // Initialize editing state when edit mode is toggled on
  const handleStartEdit = () => {
    if (!viewingDoc) return;
    setEditTitle(viewingDoc.title || '');
    setEditSummary(viewingDoc.summary || '');
    setEditSections(
      viewingDoc.sections ? JSON.parse(JSON.stringify(viewingDoc.sections)) : [],
    );
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!viewingDoc?._id || !editTitle.trim()) return;
    await updateItem(viewingDoc._id, {
      title: editTitle.trim(),
      summary: editSummary.trim(),
      sections: editSections,
    });
    setIsEditing(false);
  };

  const handleSectionHeadingChange = (index, value) => {
    setEditSections((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], heading: value };
      return copy;
    });
  };

  const handleSectionBodyChange = (index, value) => {
    setEditSections((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], body: value };
      return copy;
    });
  };

  if (!isViewDocModalOpen || !viewingDoc) return null;

  return (
    <Modal
      open={isViewDocModalOpen}
      onClose={closeViewDocModal}
      title={
        <div className={styles.modalTitle}>
          <BookOpen size={18} className={styles.titleIcon} />
          <span>{isEditing ? 'Edit Document' : viewingDoc.title}</span>
        </div>
      }
      className={styles.modalContainer}
    >
      <div className={styles.content}>
        {!isEditing ? (
          /* View Mode */
          <div className={styles.viewLayout}>
            <div className={styles.docHeader}>
              <div className={styles.headerMeta}>
                {viewingDoc.category && (
                  <Badge variant="accent" size="sm">
                    {viewingDoc.category.toUpperCase()}
                  </Badge>
                )}
                <span className={styles.dateText}>{formatDate(viewingDoc.createdAt)}</span>
              </div>
              <h1 className={styles.title}>{viewingDoc.title}</h1>

              {viewingDoc.summary && (
                <div className={styles.summaryBox}>
                  <p>{viewingDoc.summary}</p>
                </div>
              )}
            </div>

            <div className={styles.sectionsContainer}>
              {Array.isArray(viewingDoc.sections) && viewingDoc.sections.length > 0 ? (
                viewingDoc.sections.map((sec, idx) => (
                  <div key={idx} className={styles.sectionBlock}>
                    <h2 className={styles.sectionHeading}>{sec.heading}</h2>
                    <div className={styles.sectionBody}>
                      <MarkdownRenderer content={sec.body || ''} />
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionBody}>
                    <MarkdownRenderer content={viewingDoc.content || 'No content available.'} />
                  </div>
                </div>
              )}
            </div>

            <div className={styles.footerActions}>
              <Button
                variant="secondary"
                onClick={handleStartEdit}
                leftIcon={<Pencil size={14} />}
              >
                Edit Sections
              </Button>
              <Button
                variant="primary"
                onClick={() => exportPdf(viewingDoc)}
                disabled={isExportingPdf}
                loading={isExportingPdf}
                leftIcon={<Download size={15} />}
              >
                Download PDF
              </Button>
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <div className={styles.editLayout}>
            <div className={styles.editForm}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Title</label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Document Title"
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Summary</label>
                <Textarea
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  placeholder="Brief summary..."
                  rows={2}
                />
              </div>

              <div className={styles.sectionsEditList}>
                <label className={styles.label}>Sections</label>
                {editSections.map((sec, i) => (
                  <div key={i} className={styles.sectionEditItem}>
                    <Input
                      value={sec.heading}
                      onChange={(e) => handleSectionHeadingChange(i, e.target.value)}
                      placeholder="Section heading"
                      className={styles.secHeadingInput}
                    />
                    <Textarea
                      value={sec.body}
                      onChange={(e) => handleSectionBodyChange(i, e.target.value)}
                      placeholder="Section markdown content..."
                      rows={4}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.footerActions}>
              <Button variant="ghost" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveEdit}
                disabled={isUpdating || !editTitle.trim()}
                loading={isUpdating}
                leftIcon={<Check size={14} />}
              >
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
