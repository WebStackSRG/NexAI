import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Lock, Sparkles, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useProjectStore } from '@/store/projectStore';
import styles from './ProjectSettingsModal.module.scss';

const COLOR_PRESETS = [
  { label: 'Violet', value: '#8b5cf6' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Rose', value: '#f43f5e' },
  { label: 'Cyan', value: '#06b6d4' },
];

export function ProjectSettingsModal({
  open,
  onClose,
  project,
  onSuccess,
  onOpenDeleteConfirm,
}) {
  const { updateProject, isSaving } = useProjectStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [color, setColor] = useState('#8b5cf6');
  const [error, setError] = useState('');

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setDescription(project.description || '');
      setCustomInstructions(project.customInstructions || '');
      setColor(project.color || '#8b5cf6');
      setError('');
    }
  }, [project, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    setError('');

    if (!project?._id) return;

    const payload = {
      name: name.trim(),
      description: description.trim(),
      customInstructions: customInstructions.trim(),
      color,
    };

    const result = await updateProject(project._id, payload);
    if (result) {
      onSuccess?.(result);
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Project settings">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="proj-name">
            Project name *
          </label>
          <Input
            id="proj-name"
            placeholder="e.g. Java Buddy Unit-1, System Architecture"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            error={error}
            autoFocus
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="proj-desc">
            Description
          </label>
          <Input
            id="proj-desc"
            placeholder="e.g. A Java helper AI for unit one"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="proj-instructions">
            <Sparkles size={14} /> Instructions
          </label>
          <span className={styles.hint}>
            Set context and customize how NexAI responds in this project.
          </span>
          <Textarea
            id="proj-instructions"
            placeholder="e.g. 'You are a smart and friendly study buddy for a Diploma MSBTE student. Answer in clean bullet points. Reference uploaded source files.'"
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            rows={5}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Memory & Context Scope</label>
          <div className={styles.memoryBox}>
            <div className={styles.memoryTitleRow}>
              <span className={styles.memoryTitle}>
                <Lock size={14} /> Project-only memory
              </span>
              <span className={styles.lockBadge}>Active</span>
            </div>
            <p className={styles.memoryDesc}>
              This project can only access its own memory and uploaded source documents. Context is strictly isolated from outside chats.
            </p>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Theme Accent</label>
          <div className={styles.colorPalette}>
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                className={`${styles.colorChip} ${color === preset.value ? styles.colorActive : ''}`}
                style={{ backgroundColor: preset.value }}
                onClick={() => setColor(preset.value)}
                aria-label={`Select ${preset.label} color`}
              />
            ))}
          </div>
        </div>

        <div className={styles.bottomRow}>
          {onOpenDeleteConfirm ? (
            <Button
              type="button"
              variant="danger"
              size="sm"
              icon={<Trash2 size={14} />}
              onClick={() => {
                onClose();
                onOpenDeleteConfirm();
              }}
            >
              Delete project
            </Button>
          ) : (
            <div />
          )}

          <div className={styles.btnGroup}>
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSaving}>
              Save changes
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

ProjectSettingsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  project: PropTypes.object,
  onSuccess: PropTypes.func,
  onOpenDeleteConfirm: PropTypes.func,
};
