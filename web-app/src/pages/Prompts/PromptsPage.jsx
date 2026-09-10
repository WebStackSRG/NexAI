import React, { useEffect } from 'react';
import {
  Plus,
  Sparkles,
  Search,
  Pin,
  Trash2,
  Edit2,
  Play,
  Grid,
  List as ListIcon,
  Tag,
  Clock,
  CheckCircle2,
  Code,
  BookOpen,
} from 'lucide-react';
import usePromptStore from '../../store/promptStore';
import PromptModal from '../../components/prompts/PromptModal';
import VariableFillModal from '../../components/prompts/VariableFillModal';
import styles from './PromptsPage.module.scss';

export default function PromptsPage() {
  const {
    prompts,
    searchQuery,
    selectedTag,
    viewMode,
    isLoading,
    setViewMode,
    setSearchQuery,
    setSelectedTag,
    loadPrompts,
    openCreateModal,
    openFillModal,
    togglePin,
    removePrompt,
  } = usePromptStore();

  useEffect(() => {
    loadPrompts();
  }, [searchQuery, selectedTag]);

  // Aggregate all unique tags from prompts
  const allTags = [
    ...new Set(
      prompts.reduce((acc, p) => [...acc, ...(p.tags || [])], [])
    ),
  ];

  return (
    <div className={styles.prompts}>
      {/* Dialog Modals */}
      <PromptModal />
      <VariableFillModal />

      {/* Header */}
      <div className={styles.prompts__header}>
        <div>
          <h2 className={styles.prompts__title}>Prompt Vault</h2>
          <p className={styles.prompts__description}>
            Curate, parameterize, and launch reusable AI prompts with variable interpolation (e.g. <code>&#123;&#123;variable&#125;&#125;</code>).
          </p>
        </div>
        <button
          type="button"
          onClick={() => openCreateModal()}
          className={styles.prompts__actionButton}
        >
          <Plus size={16} />
          <span>New Prompt</span>
        </button>
      </div>

      {/* Search, Filter & Layout Controls */}
      <div className={styles.prompts__toolbar}>
        <div className={styles.prompts__searchBox}>
          <Search size={15} color="var(--text-tertiary)" />
          <input
            type="text"
            placeholder="Search templates, tags, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.prompts__controls}>
          {/* Tag Selector */}
          <div className={styles.prompts__tagsBar}>
            <button
              type="button"
              onClick={() => setSelectedTag('all')}
              className={`${styles.prompts__tagBtn} ${
                selectedTag === 'all' ? styles['prompts__tagBtn--active'] : ''
              }`}
            >
              All Prompts
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag === selectedTag ? 'all' : tag)}
                className={`${styles.prompts__tagBtn} ${
                  selectedTag === tag ? styles['prompts__tagBtn--active'] : ''
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className={styles.prompts__viewToggle}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`${styles.prompts__viewBtn} ${
                viewMode === 'grid' ? styles['prompts__viewBtn--active'] : ''
              }`}
              title="Grid View"
            >
              <Grid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`${styles.prompts__viewBtn} ${
                viewMode === 'list' ? styles['prompts__viewBtn--active'] : ''
              }`}
              title="List View"
            >
              <ListIcon size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Prompt Items Display */}
      {isLoading ? (
        <div className={styles.prompts__loading}>
          <span>Loading prompt vault...</span>
        </div>
      ) : prompts.length === 0 ? (
        <div className={styles.prompts__empty}>
          <Sparkles size={40} color="var(--color-accent)" opacity={0.6} />
          <h3>No Prompts Found</h3>
          <p>
            {searchQuery || selectedTag !== 'all'
              ? 'No templates match your search criteria. Try clearing your filters.'
              : 'Create your first prompt template with dynamic {{variables}} to fast-track your AI workflows.'}
          </p>
          <button
            type="button"
            onClick={() => openCreateModal()}
            className={styles.prompts__actionButton}
          >
            <Plus size={16} />
            <span>Create First Prompt</span>
          </button>
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid' ? styles.prompts__grid : styles.prompts__list
          }
        >
          {prompts.map((prompt) => {
            const id = prompt._id || prompt.id;
            const vars = prompt.variables || [];

            return (
              <div
                key={id}
                className={`${styles.prompts__card} ${
                  prompt.pinned ? styles['prompts__card--pinned'] : ''
                }`}
              >
                <div className={styles.prompts__cardHeader}>
                  <div className={styles.prompts__cardTitleRow}>
                    <h3 className={styles.prompts__cardTitle}>{prompt.title}</h3>
                    {prompt.pinned && (
                      <span className={styles.prompts__pinnedBadge}>
                        <Pin size={11} /> Pinned
                      </span>
                    )}
                  </div>

                  <div className={styles.prompts__cardActions}>
                    <button
                      type="button"
                      onClick={() => togglePin(prompt)}
                      className={styles.prompts__iconBtn}
                      title={prompt.pinned ? 'Unpin' : 'Pin to top'}
                    >
                      <Pin
                        size={14}
                        color={prompt.pinned ? 'var(--color-accent)' : 'inherit'}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => openCreateModal(prompt)}
                      className={styles.prompts__iconBtn}
                      title="Edit template"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Delete this prompt template?')) {
                          removePrompt(id);
                        }
                      }}
                      className={`${styles.prompts__iconBtn} ${styles['prompts__iconBtn--danger']}`}
                      title="Delete template"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className={styles.prompts__cardBody}>
                  <pre className={styles.prompts__templateText}>{prompt.template}</pre>
                </div>

                {/* Variable Pills */}
                {vars.length > 0 && (
                  <div className={styles.prompts__varsRow}>
                    {vars.map((v) => (
                      <span key={v} className={styles.prompts__varPill}>
                        &#123;&#123;{v}&#125;&#125;
                      </span>
                    ))}
                  </div>
                )}

                {/* Tags & Footer */}
                <div className={styles.prompts__cardFooter}>
                  <div className={styles.prompts__tagsWrap}>
                    {(prompt.tags || []).map((t) => (
                      <span key={t} className={styles.prompts__tag}>
                        #{t}
                      </span>
                    ))}
                    <span className={styles.prompts__useCount}>
                      Used {prompt.useCount || 0} times
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => openFillModal(prompt)}
                    className={styles.prompts__useBtn}
                  >
                    <Play size={12} />
                    <span>Use Prompt</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
