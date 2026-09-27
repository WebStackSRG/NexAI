import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { SlidersHorizontal, ChevronDown, X, Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import styles from './FilterPopover.module.scss';

export function FilterPopover({ tags = [], activeTag, onSelectTag }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const popoverRef = useRef(null);
  const inputRef = useRef(null);

  // Close on click outside or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    } else if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  const filteredTags = (tags || []).filter((tag) =>
    tag.toLowerCase().includes(searchQuery.toLowerCase().trim()),
  );

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (tag) => {
    onSelectTag(tag);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onSelectTag(null);
    setIsOpen(false);
  };

  return (
    <div className={styles.container} ref={popoverRef}>
      {/* Filter Trigger Button */}
      <button
        type="button"
        className={cn(styles.triggerBtn, activeTag && styles.triggerBtnActive, isOpen && styles.triggerBtnOpen)}
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title={activeTag ? `Filtered by #${activeTag}` : 'Filter by tag'}
      >
        <SlidersHorizontal size={15} />
        <span className={styles.triggerLabel}>
          {activeTag ? `#${activeTag}` : 'Filter'}
        </span>
        {activeTag ? (
          <span
            className={styles.clearBtn}
            onClick={handleClear}
            title="Clear active filter"
            aria-label="Clear active filter"
          >
            <X size={12} />
          </span>
        ) : (
          <ChevronDown
            size={13}
            className={cn(styles.chevron, isOpen && styles.chevronRotated)}
          />
        )}
      </button>

      {/* Professional Popover Window */}
      {isOpen && (
        <div className={styles.popover} role="dialog" aria-label="Filter tags">
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerTitleRow}>
              <span className={styles.headerTitle}>Filter by Tag</span>
              <span className={styles.headerBadge}>{tags.length} total</span>
            </div>
            {activeTag && (
              <button
                type="button"
                className={styles.resetHeaderBtn}
                onClick={handleClear}
              >
                Reset
              </button>
            )}
          </div>

          {/* Search Input for fast navigation */}
          {tags.length > 4 && (
            <div className={styles.searchBox}>
              <Search size={13} className={styles.searchIcon} />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tags..."
                className={styles.searchInput}
              />
              {searchQuery && (
                <button
                  type="button"
                  className={styles.searchClearBtn}
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear tag search"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          )}

          {/* Scrollable Tag List (constrained height, never spills) */}
          <div className={styles.tagList} role="listbox">
            {/* All Tags / Clear Filter Option */}
            <button
              type="button"
              role="option"
              aria-selected={activeTag === null}
              className={cn(styles.tagOption, activeTag === null && styles.tagOptionActive)}
              onClick={() => handleSelect(null)}
            >
              <span className={styles.tagOptionLabel}>All Tags (Show All)</span>
              {activeTag === null && <Check size={14} className={styles.checkIcon} />}
            </button>

            <div className={styles.divider} />

            {filteredTags.length === 0 ? (
              <div className={styles.emptySearch}>
                No tags match &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              filteredTags.map((tag) => {
                const isSelected = activeTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={cn(styles.tagOption, isSelected && styles.tagOptionActive)}
                    onClick={() => handleSelect(isSelected ? null : tag)}
                  >
                    <span className={styles.tagOptionHash}>#</span>
                    <span className={styles.tagOptionLabel}>{tag}</span>
                    {isSelected && <Check size={14} className={styles.checkIcon} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

FilterPopover.propTypes = {
  tags: PropTypes.arrayOf(PropTypes.string),
  activeTag: PropTypes.string,
  onSelectTag: PropTypes.func.isRequired,
};
