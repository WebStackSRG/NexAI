import { useState, useEffect } from 'react';
import { Plus, Bookmark, RefreshCw, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchBar } from '@/components/common/SearchBar';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { LibraryCard, SaveItemModal, EditItemModal } from '@/features/library';
import { useLibraryStore } from '@/store/libraryStore';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils/cn';
import styles from './LibraryPage.module.scss';

export default function LibraryPage() {
  const {
    items,
    tags,
    activeTag,
    isLoading,
    isSearching,
    error,
    fetchItems,
    searchItems,
    setActiveTag,
    openAddModal,
    openEditModal,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDeleteItem,
    isConfirmDeleteOpen,
    itemToDelete,
    isDeleting,
  } = useLibraryStore();

  const [localSearch, setLocalSearch] = useState('');
  const debouncedSearch = useDebounce(localSearch, 350);

  // Initial load
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Reactive semantic search on debounced input
  useEffect(() => {
    searchItems(debouncedSearch);
  }, [debouncedSearch, searchItems]);

  const handleClearSearch = () => {
    setLocalSearch('');
    searchItems('');
  };

  const isSearchActive = Boolean(debouncedSearch.trim());

  return (
    <div className={styles.page}>
      <PageHeader
        title="Personal Library"
        description="Save links and notes with automated summaries, auto-tags, and semantic vector search."
        actions={
          <Button variant="primary" onClick={openAddModal} leftIcon={<Plus size={16} />}>
            Add Item
          </Button>
        }
      />

      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <SearchBar
            value={localSearch}
            onChange={setLocalSearch}
            onClear={handleClearSearch}
            placeholder="Search by meaning or keyword (e.g. 'state management' or 'docker')..."
          />
        </div>

        {tags && tags.length > 0 && (
          <div className={styles.tagFilterBar}>
            <span className={styles.tagFilterLabel}>Filter:</span>
            <button
              type="button"
              className={cn(styles.tagFilterChip, activeTag === null && styles.active)}
              onClick={() => setActiveTag(null)}
            >
              All Items
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={cn(styles.tagFilterChip, activeTag === tag && styles.active)}
                onClick={() => setActiveTag(tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {isSearchActive && (
          <div className={styles.semanticIndicator}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} className={styles.semanticQuery} />
              <span>
                Semantic search results for{' '}
                <span className={styles.semanticQuery}>&ldquo;{debouncedSearch}&rdquo;</span>
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClearSearch}>
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Loading Skeletons */}
      {(isLoading || isSearching) && items.length === 0 ? (
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className={styles.skeletonCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Skeleton width={28} height={28} radius="sm" />
                <Skeleton width={60} height={18} radius="sm" />
              </div>
              <Skeleton width="80%" height={22} radius="sm" />
              <Skeleton width="100%" height={16} radius="sm" />
              <Skeleton width="90%" height={16} radius="sm" />
              <div style={{ marginTop: 'auto', display: 'flex', gap: '6px' }}>
                <Skeleton width={50} height={20} radius="full" />
                <Skeleton width={60} height={20} radius="full" />
              </div>
            </div>
          ))}
        </div>
      ) : error && items.length === 0 ? (
        /* Error State */
        <div className={styles.errorState}>
          <p className={styles.errorText}>{error}</p>
          <Button
            variant="secondary"
            onClick={() => fetchItems()}
            leftIcon={<RefreshCw size={16} />}
          >
            Retry Loading
          </Button>
        </div>
      ) : items.length === 0 ? (
        /* Empty State */
        <EmptyState
          icon={<Bookmark size={32} />}
          title={
            isSearchActive
              ? `No items found matching "${debouncedSearch}"`
              : activeTag
                ? `No items tagged #${activeTag}`
                : 'Your library is empty'
          }
          description={
            isSearchActive
              ? 'Try different keywords or concepts. Semantic search matches meaning across summaries and content.'
              : activeTag
                ? 'Try selecting another tag or view all saved items.'
                : 'Save articles, documentation, or quick notes. Review AI-suggested summaries and tags before storing.'
          }
          action={
            isSearchActive ? (
              <Button variant="secondary" onClick={handleClearSearch}>
                Clear Search
              </Button>
            ) : activeTag ? (
              <Button variant="secondary" onClick={() => setActiveTag(null)}>
                Show All Items
              </Button>
            ) : (
              <Button variant="primary" onClick={openAddModal} leftIcon={<Plus size={16} />}>
                Add Your First Item
              </Button>
            )
          }
        />
      ) : (
        /* Items Grid */
        <div className={styles.grid}>
          {items.map((item) => (
            <LibraryCard
              key={item._id}
              item={item}
              activeTag={activeTag}
              onTagClick={(tag) => setActiveTag(tag)}
              onEdit={openEditModal}
              onDelete={openDeleteDialog}
            />
          ))}
        </div>
      )}

      {/* Add / Suggest Modal (Suggest -> Review -> Confirm) */}
      <SaveItemModal />

      {/* Edit Modal */}
      <EditItemModal />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isConfirmDeleteOpen}
        title="Delete Library Item"
        description={`Are you sure you want to delete "${itemToDelete?.title || 'this item'}"? This will also remove it from semantic search.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
        loading={isDeleting}
        onConfirm={confirmDeleteItem}
        onCancel={closeDeleteDialog}
      />
    </div>
  );
}
