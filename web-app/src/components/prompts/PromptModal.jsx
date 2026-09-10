import React, { useState, useEffect } from 'react';
import { X, Sparkles, Tag, Pin } from 'lucide-react';
import usePromptStore from '../../store/promptStore';
import styles from '../../pages/Prompts/PromptsPage.module.scss';

export default function PromptModal() {
  const { isCreateModalOpen, activePrompt, closeCreateModal, savePrompt } = usePromptStore();

  const [title, setTitle] = useState('');
  const [template, setTemplate] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [pinned, setPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activePrompt) {
      setTitle(activePrompt.title || '');
      setTemplate(activePrompt.template || '');
      setTags(activePrompt.tags || []);
      setPinned(!!activePrompt.pinned);
    } else {
      setTitle('');
      setTemplate('');
      setTags([]);
      setPinned(false);
    }
    setTagInput('');
    setError('');
  }, [activePrompt, isCreateModalOpen]);

  if (!isCreateModalOpen) return null;

  // Real-time extracted variables preview
  const extractedVars = [
    ...new Set(
      (template.match(/\{\{([a-zA-Z0-9_]+)\}\}/g) || []).map((m) =>
        m.replace(/\{\{|\}\}/g, '').trim()
      )
    ),
  ];

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/^#/, '');
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !template.trim()) {
      setError('Title and template text are required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await savePrompt({
        id: activePrompt?._id || activePrompt?.id,
        title: title.trim(),
        template: template.trim(),
        tags,
        pinned,
      });
      closeCreateModal();
    } catch (err) {
      setError(err.message || 'Failed to save prompt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={closeCreateModal}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modal__header}>
          <div className={styles.modal__titleWrap}>
            <Sparkles size={18} color="var(--color-accent)" />
            <h3>{activePrompt ? 'Edit Template' : 'New System Prompt Template'}</h3>
          </div>
          <button type="button" onClick={closeCreateModal} className={styles.modal__closeBtn}>
            <X size={18} />
          </button>
        </div>

        {error && <div className={styles.modal__error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.modal__form}>
          <div className={styles.modal__field}>
            <label className={styles.modal__label}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Socratic Code Reviewer"
              className={styles.modal__input}
              required
            />
          </div>

          <div className={styles.modal__field}>
            <div className={styles.modal__labelRow}>
              <label className={styles.modal__label}>Prompt Template</label>
              <span className={styles.modal__hint}>
                Use <code>&#123;&#123;variable&#125;&#125;</code> for dynamic inputs
              </span>
            </div>
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="e.g. Review the following {{language}} code for architectural anti-patterns and performance bottlenecks:&#10;&#10;{{code}}"
              className={styles.modal__textarea}
              rows={6}
              required
            />
          </div>

          {/* Extracted Variables Badges */}
          {extractedVars.length > 0 && (
            <div className={styles.modal__varsRow}>
              <span className={styles.modal__varsLabel}>Detected Variables:</span>
              <div className={styles.modal__varsList}>
                {extractedVars.map((v) => (
                  <span key={v} className={styles.modal__varChip}>
                    &#123;&#123;{v}&#125;&#125;
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div className={styles.modal__field}>
            <label className={styles.modal__label}>Tags</label>
            <div className={styles.modal__tagsWrap}>
              {tags.map((t) => (
                <span key={t} className={styles.modal__tagChip}>
                  #{t}
                  <button type="button" onClick={() => handleRemoveTag(t)}>
                    &times;
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Add tag and press Enter..."
                className={styles.modal__tagInput}
              />
            </div>
          </div>

          {/* Pin Checkbox */}
          <div className={styles.modal__checkboxRow}>
            <label className={styles.modal__checkboxLabel}>
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
              />
              <span>Pin to top of vault</span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className={styles.modal__footer}>
            <button
              type="button"
              onClick={closeCreateModal}
              className={styles.modal__cancelBtn}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={styles.modal__submitBtn}
            >
              {isSubmitting ? 'Saving...' : activePrompt ? 'Save Changes' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
