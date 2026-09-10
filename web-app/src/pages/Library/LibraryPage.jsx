import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  BookOpen,
  Link2,
  FileText,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Clock,
  Sparkles,
  Loader2,
  UploadCloud,
  FileImage,
} from 'lucide-react';
import styles from './LibraryPage.module.scss';
import useLibraryStore from '../../store/libraryStore';
import SaveItemModal from '../../components/library/SaveItemModal';
import ConfirmReviewDialog from '../../components/library/ConfirmReviewDialog';
import FileUploadModal from '../../components/library/FileUploadModal';

export default function LibraryPage() {
  const {
    items,
    isLoading,
    filterType,
    filterStatus,
    searchQuery,
    fetchItems,
    openSaveModal,
    openReviewModal,
    deleteItem,
    setFilterType,
    setFilterStatus,
    setSearchQuery,
  } = useLibraryStore();

  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [fetchItems, filterType, filterStatus, searchQuery]);

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this item from your library?')) {
      deleteItem(id);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className={styles.library}>
      {/* ── Modals ───────────────────────────────────────────── */}
      <SaveItemModal />
      <ConfirmReviewDialog />

      {/* ── Header ───────────────────────────────────────────── */}
      <div className={styles.library__header}>
        <div>
          <h1 className={styles.library__title}>Personal Knowledge Library</h1>
          <p className={styles.library__subtitle}>
            Curate links, articles, notes, and multimodal files with automated AI summarization
            and vector embeddings.
          </p>
        </div>
        <div className={styles.library__headerActions}>
          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className={styles.library__uploadBtn}
          >
            <UploadCloud size={16} />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            onClick={openSaveModal}
            className={styles.library__addBtn}
          >
            <Plus size={16} />
            <span>Add to Library</span>
          </button>
        </div>
      </div>

      <FileUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
      />
      {/* ── Toolbar & Filters ────────────────────────────────── */}
      <div className={styles.library__toolbar}>
        <div className={styles.library__searchBox}>
          <Search size={14} color="var(--text-tertiary)" />
          <input
            type="text"
            placeholder="Search by title, summary, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.library__filters}>
          <button
            type="button"
            onClick={() => {
              setFilterType('all');
              setFilterStatus('all');
            }}
            className={`${styles.library__filterBtn} ${
              filterType === 'all' && filterStatus === 'all'
                ? styles['library__filterBtn--active']
                : ''
            }`}
          >
            All Items
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterType('link');
              setFilterStatus('all');
            }}
            className={`${styles.library__filterBtn} ${
              filterType === 'link' ? styles['library__filterBtn--active'] : ''
            }`}
          >
            Links
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterType('note');
              setFilterStatus('all');
            }}
            className={`${styles.library__filterBtn} ${
              filterType === 'note' ? styles['library__filterBtn--active'] : ''
            }`}
          >
            Notes
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterType('file');
              setFilterStatus('all');
            }}
            className={`${styles.library__filterBtn} ${
              filterType === 'file' ? styles['library__filterBtn--active'] : ''
            }`}
          >
            Files
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterType('all');
              setFilterStatus(filterStatus === 'pending' ? 'all' : 'pending');
            }}
            className={`${styles.library__filterBtn} ${
              filterStatus === 'pending'
                ? styles['library__filterBtn--active']
                : ''
            }`}
          >
            Pending Review
          </button>
        </div>
      </div>

      {/* ── Grid ─────────────────────────────────────────────── */}
      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Loader2 size={24} className="spin" style={{ margin: '0 auto 12px' }} />
          <span style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>
            Loading your knowledge index...
          </span>
        </div>
      ) : items.length === 0 ? (
        <div className={styles.library__emptyState}>
          <BookOpen size={36} color="var(--text-tertiary)" />
          <h2 className={styles.library__emptyTitle}>
            {searchQuery ? 'No matching items found' : 'Your library is empty'}
          </h2>
          <p className={styles.library__emptyText}>
            {searchQuery
              ? 'Try adjusting your search terms or filter selection.'
              : 'Save articles, docs, files, or quick notes. NexAI will generate executive summaries and index them for conversational RAG reasoning.'}
          </p>
          {!searchQuery && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setUploadModalOpen(true)}
                className={styles.library__uploadBtn}
              >
                <UploadCloud size={16} />
                <span>Upload Document / Image</span>
              </button>
              <button
                type="button"
                onClick={openSaveModal}
                className={styles.library__addBtn}
              >
                <Plus size={16} />
                <span>Add Web Link / Note</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.library__grid}>
          {items.map((item) => {
            const id = item._id || item.id;
            const isPending = item.status === 'pending';

            return (
              <div
                key={id}
                className={`${styles.library__card} ${
                  item.pinned ? styles['library__card--pinned'] : ''
                }`}
              >
                <div className={styles.library__cardHeader}>
                  <div className={styles.library__cardIcon}>
                    {item.type === 'file' ? (
                      item.metadata?.mimeType?.startsWith('image/') ? (
                        <FileImage size={16} />
                      ) : (
                        <UploadCloud size={16} />
                      )
                    ) : item.type === 'link' ? (
                      <Link2 size={16} />
                    ) : (
                      <FileText size={16} />
                    )}
                  </div>

                  <div className={styles.library__cardMeta}>
                    <h3 className={styles.library__cardTitle} title={item.title}>
                      {item.title}
                    </h3>
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.library__cardUrl}
                        title={item.url}
                      >
                        {item.url.replace(/^https?:\/\//, '')}
                      </a>
                    ) : (
                      <span className={styles.library__cardUrl}>
                        {item.type === 'file'
                          ? `File (${item.metadata?.fileSize ? (item.metadata.fileSize / 1024).toFixed(1) + ' KB' : 'Uploaded'})`
                          : 'Raw Note'}
                      </span>
                    )}
                  </div>

                  <span
                    className={`${styles.library__statusBadge} ${
                      isPending
                        ? styles['library__statusBadge--pending']
                        : styles['library__statusBadge--confirmed']
                    }`}
                  >
                    {isPending ? (
                      <>
                        <Clock size={10} />
                        <span>Pending</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={10} />
                        <span>Indexed</span>
                      </>
                    )}
                  </span>
                </div>

                <p className={styles.library__summary}>
                  {item.summary || item.content?.slice(0, 160) || 'No summary available'}
                </p>

                {item.tags && item.tags.length > 0 && (
                  <div className={styles.library__tagsRow}>
                    {item.tags.map((tag) => (
                      <span key={tag} className={styles.library__tag}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className={styles.library__cardFooter}>
                  <span>Added {formatDate(item.createdAt)}</span>

                  <div className={styles.library__cardActions}>
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => openReviewModal(item)}
                        className={styles.library__cardActionBtn}
                        style={{ color: 'var(--color-accent)' }}
                        title="Review and confirm AI suggestions"
                      >
                        <Sparkles size={14} />
                      </button>
                    )}
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.library__cardActionBtn}
                        title="Open external link"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(id, e)}
                      className={styles.library__cardActionBtn}
                      title="Delete item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
