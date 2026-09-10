import React, { useState } from 'react';
import { X, Link2, FileText, Sparkles, Loader2 } from 'lucide-react';
import styles from './SaveItemModal.module.scss';
import useLibraryStore from '../../store/libraryStore';

export default function SaveItemModal() {
  const { saveModalOpen, closeSaveModal, saveItem, isSaving } = useLibraryStore();
  const [activeTab, setActiveTab] = useState('link'); // 'link' | 'note'
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [localError, setLocalError] = useState('');

  if (!saveModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (activeTab === 'link' && !url.trim()) {
      setLocalError('Please enter a valid website or document URL.');
      return;
    }
    if (activeTab === 'note' && !content.trim()) {
      setLocalError('Please provide note content.');
      return;
    }

    try {
      await saveItem({
        type: activeTab,
        url: activeTab === 'link' ? url.trim() : undefined,
        title: title.trim() || undefined,
        content: activeTab === 'note' ? content.trim() : undefined,
      });
      // Reset form
      setUrl('');
      setTitle('');
      setContent('');
    } catch (err) {
      setLocalError(err.message || 'Failed to save item');
    }
  };

  return (
    <div className={styles.backdrop} onClick={closeSaveModal}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modal__header}>
          <h3 className={styles.modal__title}>Save to Knowledge Library</h3>
          <button
            type="button"
            onClick={closeSaveModal}
            className={styles.modal__closeBtn}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className={styles.modal__tabs}>
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`${styles.modal__tab} ${
              activeTab === 'link' ? styles['modal__tab--active'] : ''
            }`}
          >
            <Link2 size={16} />
            <span>Web Link</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('note')}
            className={`${styles.modal__tab} ${
              activeTab === 'note' ? styles['modal__tab--active'] : ''
            }`}
          >
            <FileText size={16} />
            <span>Raw Note</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modal__body}>
            {localError && (
              <div
                style={{
                  padding: '8px 12px',
                  background: '#ef44441f',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-error)',
                  fontSize: '12px',
                }}
              >
                {localError}
              </div>
            )}

            {activeTab === 'link' ? (
              <>
                <div className={styles.modal__field}>
                  <label className={styles.modal__label}>URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/article"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    autoFocus
                    className={styles.modal__input}
                  />
                  <span className={styles.modal__hint}>
                    NexAI automatically extracts page content and generates an AI summary.
                  </span>
                </div>

                <div className={styles.modal__field}>
                  <label className={styles.modal__label}>Custom Title (Optional)</label>
                  <input
                    type="text"
                    placeholder="Leave blank to auto-detect page title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={styles.modal__input}
                  />
                </div>
              </>
            ) : (
              <>
                <div className={styles.modal__field}>
                  <label className={styles.modal__label}>Note Title</label>
                  <input
                    type="text"
                    placeholder="E.g., Architecture Discussion Notes"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus
                    className={styles.modal__input}
                  />
                </div>

                <div className={styles.modal__field}>
                  <label className={styles.modal__label}>Content / Text</label>
                  <textarea
                    placeholder="Write or paste your markdown, meeting notes, code snippets..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    className={styles.modal__textarea}
                  />
                </div>
              </>
            )}
          </div>

          <div className={styles.modal__footer}>
            <button
              type="button"
              onClick={closeSaveModal}
              className={styles.modal__cancelBtn}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={styles.modal__submitBtn}
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="spin" />
                  <span>Analyzing with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Save & Suggest</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
