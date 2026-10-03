import React, { useState, useEffect } from 'react';
import { Brain, Plus, Trash2, Pin, Sparkles, X } from 'lucide-react';
import { useMemoryStore } from '@/store/memoryStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import styles from './MemoryManager.module.scss';

const CATEGORY_OPTIONS = [
  { value: 'identity', label: 'Identity (Name, Role, Location)' },
  { value: 'preference', label: 'Preference (Stack, Styling, Tone)' },
  { value: 'project', label: 'Project (Active apps, Repos)' },
  { value: 'instruction', label: 'Instruction (System directives)' },
  { value: 'fact', label: 'General Fact' },
];

export function MemoryManager() {
  const {
    memories,
    isLoading,
    isSaving,
    fetchMemories,
    addMemory,
    deleteMemory,
    clearAll,
    togglePin,
  } = useMemoryStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newFact, setNewFact] = useState('');
  const [newCategory, setNewCategory] = useState('fact');

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newFact.trim()) return;

    const res = await addMemory({
      fact: newFact.trim(),
      category: newCategory,
    });

    if (res) {
      setNewFact('');
      setShowAddForm(false);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all persistent memories? This cannot be undone.')) {
      clearAll();
    }
  };

  return (
    <Card padding="md">
      <Card.Header>
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <div className={styles.title}>
              <Brain size={18} style={{ color: 'var(--color-primary-base)' }} />
              <span>Memory & Personalization</span>
              <span className={styles.countBadge}>{memories.length}</span>
            </div>
            <div className={styles.subtitle}>
              Persistent knowledge, identity, and preferences remembered across all conversations.
            </div>
          </div>

          <div className={styles.actions}>
            {!showAddForm && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAddForm(true)}
              >
                <Plus size={14} style={{ marginRight: 4 }} />
                Add Memory
              </Button>
            )}

            {memories.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                style={{ color: 'var(--color-error)' }}
              >
                Clear All
              </Button>
            )}
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        <div className={styles.container}>
          {showAddForm && (
            <form onSubmit={handleAddSubmit} className={styles.addForm}>
              <div className={styles.formRow}>
                <div className={styles.factInput}>
                  <Input
                    label="Memory Fact"
                    placeholder="e.g. User's name is Rewan, or Prefers TypeScript"
                    value={newFact}
                    onChange={(e) => setNewFact(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
                <div className={styles.categorySelect}>
                  <Select
                    label="Category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    options={CATEGORY_OPTIONS}
                  />
                </div>
              </div>

              <div className={styles.formButtons}>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  <X size={14} style={{ marginRight: 4 }} />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!newFact.trim() || isSaving}
                >
                  <Sparkles size={14} style={{ marginRight: 4 }} />
                  {isSaving ? 'Saving...' : 'Save Memory'}
                </Button>
              </div>
            </form>
          )}

          {isLoading ? (
            <div className={styles.emptyState}>Loading persistent memories...</div>
          ) : memories.length === 0 ? (
            <div className={styles.emptyState}>
              <div>No persistent memories recorded yet.</div>
              <div className={styles.emptyHint}>
                NexAI automatically learns facts about you (e.g., your name, tech stack, preferences) as you chat.
                You can also click <strong>Add Memory</strong> to record facts manually.
              </div>
            </div>
          ) : (
            <div className={styles.list}>
              {memories.map((mem) => (
                <div
                  key={mem._id}
                  className={`${styles.item} ${mem.pinned ? styles.pinned : ''}`}
                >
                  <div className={styles.itemContent}>
                    <span className={`${styles.categoryPill} ${styles[mem.category] || styles.fact}`}>
                      {mem.category || 'fact'}
                    </span>
                    <span className={styles.factText}>{mem.fact}</span>
                  </div>

                  <div className={styles.itemActions}>
                    <button
                      type="button"
                      className={`${styles.iconBtn} ${mem.pinned ? styles.pinnedActive : ''}`}
                      title={mem.pinned ? 'Unpin memory' : 'Pin to priority'}
                      onClick={() => togglePin(mem._id)}
                    >
                      <Pin size={14} />
                    </button>
                    <button
                      type="button"
                      className={`${styles.iconBtn} ${styles.deleteBtn}`}
                      title="Delete memory"
                      onClick={() => deleteMemory(mem._id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}
export default MemoryManager;
