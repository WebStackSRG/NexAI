import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Folder, Check, FolderMinus } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { useChatStore } from '@/store/chatStore';
import styles from './MoveToProjectModal.module.scss';

export function MoveToProjectModal({ open, onClose, chat = null, onSuccess }) {
  const { projects } = useProjectStore();
  const { moveChatToProject } = useChatStore();

  const [selectedProjectId, setSelectedProjectId] = useState(() => chat?.projectId || null);
  const [isMoving, setIsMoving] = useState(false);

  // Sync initial selection
  const currentProjectId = chat?.projectId || null;

  const handleSelect = (id) => {
    setSelectedProjectId(id);
  };

  const handleSave = async () => {
    if (!chat?._id) return;
    setIsMoving(true);
    try {
      await moveChatToProject(chat._id, selectedProjectId);
      onSuccess?.();
      onClose();
    } finally {
      setIsMoving(false);
    }
  };

  if (!chat) return null;

  return (
    <Modal open={open} onClose={onClose} title="Move Chat to Project">
      <div className={styles.container}>
        <div className={styles.chatTarget}>
          <span className={styles.targetLabel}>Moving chat:</span>
          <span className={styles.targetTitle}>{chat.title || 'Untitled Chat'}</span>
        </div>

        <div className={styles.projectList}>
          {/* Option: None / Standalone */}
          <div
            className={`${styles.projectOption} ${selectedProjectId === null ? styles.optionSelected : ''}`}
            onClick={() => handleSelect(null)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleSelect(null)}
          >
            <div className={styles.optionLeft}>
              <span className={styles.iconWrapper} style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                <FolderMinus size={15} />
              </span>
              <div className={styles.optionMeta}>
                <span className={styles.optionName}>No Project</span>
                <span className={styles.optionHint}>Standalone chat</span>
              </div>
            </div>
            {selectedProjectId === null && <Check size={16} className={styles.checkIcon} />}
          </div>

          {/* User Projects */}
          {projects.map((proj) => {
            const isSelected = selectedProjectId === proj._id;
            return (
              <div
                key={proj._id}
                className={`${styles.projectOption} ${isSelected ? styles.optionSelected : ''}`}
                onClick={() => handleSelect(proj._id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleSelect(proj._id)}
              >
                <div className={styles.optionLeft}>
                  <span
                    className={styles.iconWrapper}
                    style={{ backgroundColor: `${proj.color || '#8b5cf6'}20`, color: proj.color || '#8b5cf6' }}
                  >
                    <Folder size={15} />
                  </span>
                  <div className={styles.optionMeta}>
                    <span className={styles.optionName}>{proj.name}</span>
                    {proj.description && (
                      <span className={styles.optionDesc}>{proj.description}</span>
                    )}
                  </div>
                </div>
                {isSelected && <Check size={16} className={styles.checkIcon} />}
              </div>
            );
          })}
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isMoving}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            loading={isMoving}
            onClick={handleSave}
            disabled={selectedProjectId === currentProjectId}
          >
            Confirm Move
          </Button>
        </div>
      </div>
    </Modal>
  );
}
