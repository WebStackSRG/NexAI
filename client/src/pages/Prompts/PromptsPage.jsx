import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Plus, Search, Star, AlertCircle, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  PromptCard,
  PromptFormModal,
  VariableFillModal,
} from '@/features/prompts';
import { usePromptStore } from '@/store/promptStore';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils/cn';
import styles from './PromptsPage.module.scss';

export default function PromptsPage() {
  const navigate = useNavigate();
  const {
    prompts,
    isLoading,
    error,
    fetchPrompts,
    createPrompt,
    updatePrompt,
    deletePrompt,
    toggleFavorite,
  } = usePromptStore();

  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [activePromptForUse, setActivePromptForUse] = useState(null);
  const [deletingPrompt, setDeletingPrompt] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  // Extract all unique tags across prompts for filter pills
  const allTags = useMemo(() => {
    const tagsSet = new Set();
    prompts.forEach((p) => {
      (p.tags || []).forEach((t) => tagsSet.add(t));
    });
    return Array.from(tagsSet).sort();
  }, [prompts]);

  // Client-side filter for responsive live typing
  const filteredPrompts = useMemo(() => {
    let result = prompts;

    if (favoritesOnly) {
      result = result.filter((p) => p.isFavorite);
    }

    if (selectedTag) {
      result = result.filter((p) => p.tags?.includes(selectedTag));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          p.template.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q)),
      );
    }

    return result;
  }, [prompts, favoritesOnly, selectedTag, search]);

  const handleOpenCreate = () => {
    setEditingPrompt(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (prompt) => {
    setEditingPrompt(prompt);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (promptData) => {
    if (editingPrompt) {
      await updatePrompt(editingPrompt._id, promptData);
    } else {
      await createPrompt(promptData);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingPrompt) return;
    setIsDeleting(true);
    await deletePrompt(deletingPrompt._id);
    setIsDeleting(false);
    setDeletingPrompt(null);
  };

  const handleUsePromptInChat = (compiledPrompt) => {
    // Navigate to chat with compiled prompt pre-populated in state
    navigate(ROUTES.CHAT, { state: { prefill: compiledPrompt } });
  };

  return (
    <div className={styles.pageContainer} data-testid="prompts-page">
      <PageHeader
        title="Prompt Vault"
        description="Reusable, variable-driven prompt templates with one-click filling."
        actions={
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={handleOpenCreate}
          >
            New Prompt
          </Button>
        }
      />

      {/* Toolbar: Search input, tag filters, favorite toggle */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Input
            leftIcon={<Search size={16} />}
            placeholder="Search prompts by title, content, or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filtersWrapper}>
          <button
            type="button"
            className={cn(styles.filterPill, favoritesOnly && styles.activePill)}
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            aria-pressed={favoritesOnly}
          >
            <Star size={14} fill={favoritesOnly ? 'currentColor' : 'none'} />
            <span>Favorites</span>
          </button>

          <button
            type="button"
            className={cn(styles.filterPill, selectedTag === null && styles.activePill)}
            onClick={() => setSelectedTag(null)}
          >
            All Tags
          </button>

          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={cn(styles.filterPill, selectedTag === tag && styles.activePill)}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area with 4 UX states */}
      <div className={styles.contentArea}>
        {isLoading ? (
          <div className={styles.skeletonGrid} data-testid="prompts-skeleton">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <Skeleton height="24px" width="60%" radius="md" />
                <Skeleton height="16px" width="90%" radius="sm" />
                <Skeleton height="60px" width="100%" radius="md" />
                <Skeleton height="32px" width="40%" radius="sm" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className={styles.errorBox} role="alert">
            <AlertCircle size={28} className={styles.errorIcon} />
            <p className={styles.errorMessage}>{error}</p>
            <Button
              variant="secondary"
              leftIcon={<RefreshCw size={14} />}
              onClick={() => fetchPrompts()}
            >
              Try Again
            </Button>
          </div>
        ) : filteredPrompts.length === 0 ? (
          <EmptyState
            icon={<Terminal size={32} />}
            title={prompts.length === 0 ? 'Your vault is empty' : 'No matching prompts'}
            description={
              prompts.length === 0
                ? 'Save prompts with {{variable}} placeholders to reuse standard templates across sessions.'
                : 'No prompts found matching your current search or tag filters.'
            }
            action={
              prompts.length === 0 ? (
                <Button
                  variant="primary"
                  leftIcon={<Plus size={16} />}
                  onClick={handleOpenCreate}
                >
                  Create First Prompt
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch('');
                    setSelectedTag(null);
                    setFavoritesOnly(false);
                  }}
                >
                  Clear Filters
                </Button>
              )
            }
          />
        ) : (
          <div className={styles.grid}>
            {filteredPrompts.map((prompt) => (
              <PromptCard
                key={prompt._id}
                prompt={prompt}
                onUse={(p) => setActivePromptForUse(p)}
                onEdit={(p) => handleOpenEdit(p)}
                onDelete={(p) => setDeletingPrompt(p)}
                onToggleFavorite={(id) => toggleFavorite(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Form Modal for Creating & Editing */}
      <PromptFormModal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={editingPrompt}
        onSubmit={handleFormSubmit}
      />

      {/* Variable Fill Modal when "Use Prompt" is triggered */}
      {activePromptForUse && (
        <VariableFillModal
          open={Boolean(activePromptForUse)}
          onClose={() => setActivePromptForUse(null)}
          prompt={activePromptForUse}
          onConfirm={handleUsePromptInChat}
          actionLabel="Use in Chat"
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deletingPrompt)}
        title="Delete Prompt"
        description={`Are you sure you want to delete "${deletingPrompt?.title}"? This action cannot be undone.`}
        confirmLabel="Delete Prompt"
        tone="danger"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingPrompt(null)}
      />
    </div>
  );
}
