import { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Search, Terminal, Star, Plus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { usePromptStore } from '@/store/promptStore';
import { ROUTES } from '@/constants/routes';
import styles from './PromptPickerModal.module.scss';

export function PromptPickerModal({ open, onClose, onSelectPrompt, onManageVault }) {
  const { prompts, fetchPrompts } = usePromptStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open) {
      fetchPrompts();
      setSearch('');
    }
  }, [open, fetchPrompts]);

  const filteredPrompts = useMemo(() => {
    if (!search.trim()) return prompts;
    const q = search.toLowerCase();
    return prompts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.template.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q)),
    );
  }, [prompts, search]);

  const handleSelect = (prompt) => {
    onSelectPrompt?.(prompt);
    onClose?.();
  };

  const handleGoToVault = () => {
    onClose?.();
    if (onManageVault) {
      onManageVault();
    } else if (typeof window !== 'undefined') {
      window.location.assign(ROUTES.PROMPTS);
    }
  };

  if (!open) return null;


  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Select Prompt Template"
      className={styles.modalContent}
      footer={
        <div className={styles.footerRow}>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={handleGoToVault}
          >
            Manage Prompt Vault
          </Button>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className={styles.container}>
        <Input
          leftIcon={<Search size={16} />}
          placeholder="Search saved prompts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />

        <div className={styles.promptList} role="list">
          {filteredPrompts.length === 0 ? (
            <div className={styles.emptyNotice}>
              <Terminal size={24} className={styles.emptyIcon} />
              <p>No matching prompts found in your vault.</p>
              <Button variant="primary" size="sm" onClick={handleGoToVault}>
                Create New Prompt
              </Button>
            </div>
          ) : (
            filteredPrompts.map((p) => {
              const varCount = p.variables?.length || 0;
              return (
                <div
                  key={p._id}
                  className={styles.promptItem}
                  onClick={() => handleSelect(p)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSelect(p);
                  }}
                >
                  <div className={styles.itemHeader}>
                    <div className={styles.titleArea}>
                      {p.isFavorite && <Star size={13} className={styles.favoriteIcon} />}
                      <span className={styles.itemTitle}>{p.title}</span>
                    </div>
                    {varCount > 0 ? (
                      <Badge tone="accent" size="sm">
                        {varCount} {varCount === 1 ? 'var' : 'vars'}
                      </Badge>
                    ) : (
                      <Badge tone="neutral" size="sm">
                        static
                      </Badge>
                    )}
                  </div>
                  <p className={styles.itemPreview}>{p.template}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}

PromptPickerModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelectPrompt: PropTypes.func.isRequired,
  onManageVault: PropTypes.func,
};

