import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { TagInput } from '@/components/ui/TagInput';
import { Badge } from '@/components/ui/Badge';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import styles from './PromptFormModal.module.scss';

export function PromptFormModal({ open, onClose, initialData, onSubmit }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState('');
  const [tags, setTags] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setTitle(initialData.title || '');
        setDescription(initialData.description || '');
        setTemplate(initialData.template || '');
        setTags(initialData.tags || []);
        setIsFavorite(Boolean(initialData.isFavorite));
      } else {
        setTitle('');
        setDescription('');
        setTemplate('');
        setTags([]);
        setIsFavorite(false);
      }
      setErrors({});
      setIsSubmitting(false);
    }
  }, [open, initialData]);

  // Real-time live variable detection from template string
  const detectedVariables = useMemo(() => {
    if (!template) return [];
    const regex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
    const matches = [...template.matchAll(regex)];
    const vars = matches.map((m) => m[1].trim());
    return [...new Set(vars)];
  }, [template]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!template.trim()) {
      newErrors.template = 'Template content is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        template: template.trim(),
        tags,
        isFavorite,
      });
      onClose();
    } catch {
      // Handled by caller/store
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEdit = Boolean(initialData?._id);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Prompt Template' : 'New Prompt Template'}
      className={styles.modalContent}
      footer={
        <div className={styles.footerButtons}>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Prompt'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.topRow}>
          <div className={styles.titleInputWrapper}>
            <Input
              label="Prompt Title"
              placeholder="e.g. Code Reviewer, System Architecture Spec"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: null }));
              }}
              error={errors.title}
              required
              autoFocus
            />
          </div>

          <button
            type="button"
            className={cn(styles.favoriteToggle, isFavorite && styles.isFavorite)}
            onClick={() => setIsFavorite(!isFavorite)}
            title={isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
            aria-label={isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
          >
            <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
            <span>{isFavorite ? 'Favorite' : 'Add to Favorites'}</span>
          </button>
        </div>

        <Input
          label="Description (Optional)"
          placeholder="Brief explanation of when and how to use this prompt..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className={styles.templateSection}>
          <Textarea
            label="Template"
            hint="Use {{variable_name}} syntax to insert reusable placeholders."
            placeholder="e.g. Review the following {{language}} code and suggest improvements:&#10;&#10;{{code}}"
            value={template}
            onChange={(e) => {
              setTemplate(e.target.value);
              if (errors.template) setErrors((prev) => ({ ...prev, template: null }));
            }}
            rows={5}
            error={errors.template}
            required
          />

          {detectedVariables.length > 0 && (
            <div className={styles.variablesPreview}>
              <span className={styles.variablesLabel}>Detected Variables:</span>
              <div className={styles.variableChips}>
                {detectedVariables.map((v) => (
                  <Badge key={v} tone="accent" size="sm">
                    {`{{${v}}}`}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.tagsSection}>
          <label className={styles.sectionLabel}>Tags</label>
          <TagInput
            tags={tags}
            onChange={setTags}
            placeholder="Add tags (e.g. code, email, engineering) and press Enter..."
          />
        </div>
      </form>
    </Modal>
  );
}

PromptFormModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
};
