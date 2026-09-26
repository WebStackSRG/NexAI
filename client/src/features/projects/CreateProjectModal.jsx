import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Sparkles } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import styles from './CreateProjectModal.module.scss';

const COLOR_PRESETS = [
  { label: 'Violet', value: '#8b5cf6' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Rose', value: '#f43f5e' },
  { label: 'Cyan', value: '#06b6d4' },
];

export function CreateProjectModal({ open, onClose, projectToEdit = null, onSuccess }) {
  const { createProject, updateProject, isSaving } = useProjectStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [color, setColor] = useState('#8b5cf6');
  const [error, setError] = useState('');

  const isEditing = Boolean(projectToEdit);

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name || '');
      setDescription(projectToEdit.description || '');
      setCustomInstructions(projectToEdit.customInstructions || '');
      setColor(projectToEdit.color || '#8b5cf6');
      setError('');
    } else {
      setName('');
      setDescription('');
      setCustomInstructions('');
      setColor('#8b5cf6');
      setError('');
    }
  }, [projectToEdit, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    setError('');

    const payload = {
      name: name.trim(),
      description: description.trim(),
      customInstructions: customInstructions.trim(),
      color,
    };

    let result;
    if (isEditing) {
      result = await updateProject(projectToEdit._id, payload);
    } else {
      result = await createProject(payload);
    }

    if (result) {
      onSuccess?.(result);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit Project Workspace' : 'Create New Project'}
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <Input
            label="Project Name *"
            placeholder="e.g. Next.js SaaS, Viva AI Prep, System Design"
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
          <Input
            label="Description (Optional)"
            placeholder="Brief summary of what this project is for"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <div className={styles.instructionHeader}>
            <span className={styles.label}>
              <Sparkles size={13} className={styles.sparkleIcon} /> Custom Instructions (System Prompt)
            </span>
            <span className={styles.instructionHint}>
              AI will follow these instructions in all chats in this project
            </span>
          </div>
          <Textarea
            placeholder="e.g. You are a senior software architect. Always answer in clean ES modules, give TypeScript types, follow SOLID principles, and avoid boilerplate."
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            rows={5}
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Project Color</span>
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

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSaving}>
            {isEditing ? 'Save Changes' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
