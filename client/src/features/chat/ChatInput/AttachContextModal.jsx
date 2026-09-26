import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Bookmark,
  FileText,
  BookOpen,
  Paperclip,
  Upload,
  Search,
  Check,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { libraryApi } from '@/lib/api/library.api';
import { cn } from '@/lib/utils/cn';
import styles from './AttachContextModal.module.scss';

export function AttachContextModal({ open, onClose, onSelect, onUploadLocal }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [tabFilter, setTabFilter] = useState('all');

  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    setIsLoading(true);

    libraryApi
      .getItems({ limit: 50 })
      .then((res) => {
        if (isMounted) {
          setItems(res.data || []);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open]);

  if (!open) return null;

  const filteredItems = items.filter((item) => {
    if (tabFilter === 'documents' && item.type !== 'document') return false;
    if (tabFilter === 'files' && item.type !== 'file') return false;
    if (tabFilter === 'notes' && !['note', 'link'].includes(item.type)) return false;

    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      item.title?.toLowerCase().includes(query) ||
      item.summary?.toLowerCase().includes(query) ||
      item.tags?.some((t) => t.toLowerCase().includes(query))
    );
  });

  const getItemContent = (item) => {
    if (item.content) return item.content;
    if (item.sections && item.sections.length > 0) {
      return item.sections.map((s) => `${s.heading}:\n${s.body}`).join('\n\n');
    }
    return item.summary || '';
  };

  const handleSelectItem = (item) => {
    onSelect({
      id: item._id,
      name: item.title,
      type: item.type,
      category: item.category,
      content: getItemContent(item),
    });
    onClose();
  };

  const renderIcon = (type) => {
    switch (type) {
      case 'document':
        return <BookOpen size={15} />;
      case 'file':
        return <Paperclip size={15} />;
      default:
        return <FileText size={15} />;
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className={styles.modalTitle}>
          <Bookmark size={18} className={styles.titleIcon} />
          <span>Attach Context to Chat</span>
        </div>
      }
      className={styles.modalContainer}
    >
      <div className={styles.container}>
        <div className={styles.topActions}>
          <Button
            variant="secondary"
            onClick={() => {
              onClose();
              onUploadLocal?.();
            }}
            leftIcon={<Upload size={14} />}
            fullWidth
          >
            Upload New File from Device
          </Button>
        </div>

        <div className={styles.divider}>
          <span>OR CHOOSE FROM YOUR LIBRARY</span>
        </div>

        <div className={styles.searchBarWrapper}>
          <Search size={14} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search saved notes, documents, and files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.tabFilters}>
          <button
            type="button"
            className={cn(styles.tabChip, tabFilter === 'all' && styles.activeTab)}
            onClick={() => setTabFilter('all')}
          >
            All Items
          </button>
          <button
            type="button"
            className={cn(styles.tabChip, tabFilter === 'documents' && styles.activeTab)}
            onClick={() => setTabFilter('documents')}
          >
            Documents
          </button>
          <button
            type="button"
            className={cn(styles.tabChip, tabFilter === 'files' && styles.activeTab)}
            onClick={() => setTabFilter('files')}
          >
            Files
          </button>
          <button
            type="button"
            className={cn(styles.tabChip, tabFilter === 'notes' && styles.activeTab)}
            onClick={() => setTabFilter('notes')}
          >
            Notes & Links
          </button>
        </div>

        <div className={styles.itemsList}>
          {isLoading ? (
            <div className={styles.emptyText}>Loading library items...</div>
          ) : filteredItems.length === 0 ? (
            <div className={styles.emptyText}>
              {search ? 'No library items match your search.' : 'No library items found.'}
            </div>
          ) : (
            filteredItems.map((item) => (
              <div key={item._id} className={styles.itemRow} onClick={() => handleSelectItem(item)}>
                <div className={styles.itemIcon}>{renderIcon(item.type)}</div>
                <div className={styles.itemMeta}>
                  <div className={styles.itemTitleRow}>
                    <span className={styles.itemTitle}>{item.title}</span>
                    {item.category && (
                      <Badge variant="accent" size="sm">
                        {item.category}
                      </Badge>
                    )}
                  </div>
                  {item.summary && <span className={styles.itemSummary}>{item.summary}</span>}
                </div>
                <Button size="sm" variant="ghost" leftIcon={<Check size={13} />}>
                  Attach
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}

AttachContextModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  onUploadLocal: PropTypes.func.isRequired,
};
