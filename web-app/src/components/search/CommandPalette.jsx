import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MessageSquare,
  BookOpen,
  FileText,
  Sparkles,
  Settings,
  Code2,
  GraduationCap,
  BarChart3,
  ShieldCheck,
  Plus,
  ArrowRight,
  CornerDownLeft,
  X,
  Link2,
} from 'lucide-react';
import { searchGlobal } from '../../lib/searchApi';
import styles from './CommandPalette.module.scss';

const DEFAULT_COMMANDS = [
  {
    id: 'nav-chat',
    title: 'New AI Chat',
    category: 'Actions',
    icon: MessageSquare,
    path: '/chat',
    shortcut: 'C',
  },
  {
    id: 'nav-doc',
    title: 'Open Document Studio',
    category: 'Actions',
    icon: FileText,
    path: '/documents',
    shortcut: 'D',
  },
  {
    id: 'nav-lib',
    title: 'Knowledge Library',
    category: 'Navigation',
    icon: BookOpen,
    path: '/library',
    shortcut: 'L',
  },
  {
    id: 'nav-prompts',
    title: 'Prompt Vault',
    category: 'Navigation',
    icon: Sparkles,
    path: '/prompts',
    shortcut: 'P',
  },
  {
    id: 'nav-settings',
    title: 'Workspace Settings',
    category: 'Navigation',
    icon: Settings,
    path: '/settings',
    shortcut: 'S',
  },
  {
    id: 'nav-devtools',
    title: 'Developer Utilities',
    category: 'Tools',
    icon: Code2,
    path: '/devtools',
    shortcut: 'U',
  },
  {
    id: 'nav-focus',
    title: 'Focus & Reminders',
    category: 'Tools',
    icon: GraduationCap,
    path: '/focus',
  },
  {
    id: 'nav-analytics',
    title: 'Usage Analytics',
    category: 'Tools',
    icon: BarChart3,
    path: '/analytics',
  },
  {
    id: 'nav-security',
    title: 'Secrets Vault',
    category: 'Tools',
    icon: ShieldCheck,
    path: '/security',
  },
];

export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults(null);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Execute backend search when query length >= 2
  useEffect(() => {
    if (!isOpen) return;

    if (query.trim().length < 2) {
      setResults(null);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchGlobal(query.trim());
        setResults(data.results);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Assemble flattened list of items for keyboard navigation
  const flatItems = [];

  if (!results || query.trim().length < 2) {
    // Show filtered default commands
    const q = query.toLowerCase().trim();
    const filteredCommands = q
      ? DEFAULT_COMMANDS.filter((cmd) =>
          cmd.title.toLowerCase().includes(q) || cmd.category.toLowerCase().includes(q)
        )
      : DEFAULT_COMMANDS;

    filteredCommands.forEach((cmd) => {
      flatItems.push({
        type: 'command',
        data: cmd,
      });
    });
  } else {
    // Add semantic / library results
    (results.semantic || []).forEach((item) => {
      flatItems.push({
        type: 'semantic',
        title: item.title,
        subtitle: `Semantic Match • ${item.score}% confidence`,
        path: '/library',
      });
    });

    (results.library || []).forEach((item) => {
      flatItems.push({
        type: 'library',
        title: item.title,
        subtitle: item.summary?.slice(0, 70) || item.url || 'Library item',
        path: '/library',
      });
    });

    (results.documents || []).forEach((doc) => {
      flatItems.push({
        type: 'document',
        title: doc.title,
        subtitle: `${doc.sections?.length || 0} sections • Document Studio`,
        path: '/documents',
      });
    });

    (results.prompts || []).forEach((p) => {
      flatItems.push({
        type: 'prompt',
        title: p.title,
        subtitle: `Template • [${(p.variables || []).join(', ')}]`,
        path: '/prompts',
      });
    });

    (results.chats || []).forEach((chat) => {
      flatItems.push({
        type: 'chat',
        title: chat.title,
        subtitle: 'Chat Conversation',
        path: '/chat',
      });
    });
  }

  // Keyboard navigation listener (ArrowUp, ArrowDown, Enter, Escape)
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < flatItems.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems[selectedIndex]) {
        handleSelectItem(flatItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleSelectItem = (item) => {
    onClose();
    if (item.type === 'command') {
      navigate(item.data.path);
    } else if (item.path) {
      navigate(item.path);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.paletteOverlay} onClick={onClose}>
      <div className={styles.palette} onClick={(e) => e.stopPropagation()}>
        {/* Search Input Bar */}
        <div className={styles.palette__inputBar}>
          <Search size={18} className={styles.palette__searchIcon} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search across your library, documents, and chats..."
            className={styles.palette__input}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className={styles.palette__clearBtn}
            >
              <X size={14} />
            </button>
          )}
          <kbd className={styles.palette__escKey}>ESC</kbd>
        </div>

        {/* Results List */}
        <div className={styles.palette__results}>
          {isSearching ? (
            <div className={styles.palette__status}>
              <span>Searching semantic knowledge & documents...</span>
            </div>
          ) : flatItems.length === 0 ? (
            <div className={styles.palette__status}>
              <span>No results found for "{query}"</span>
            </div>
          ) : (
            flatItems.map((item, idx) => {
              const isSelected = selectedIndex === idx;

              if (item.type === 'command') {
                const Icon = item.data.icon;
                return (
                  <div
                    key={item.data.id}
                    className={`${styles.palette__item} ${
                      isSelected ? styles['palette__item--selected'] : ''
                    }`}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div className={styles.palette__itemIcon}>
                      <Icon size={16} />
                    </div>
                    <div className={styles.palette__itemContent}>
                      <span className={styles.palette__itemTitle}>{item.data.title}</span>
                      <span className={styles.palette__itemCategory}>{item.data.category}</span>
                    </div>
                    {item.data.shortcut && (
                      <kbd className={styles.palette__itemShortcut}>{item.data.shortcut}</kbd>
                    )}
                    <CornerDownLeft size={12} className={styles.palette__enterIcon} />
                  </div>
                );
              }

              // Entity Search Result
              return (
                <div
                  key={idx}
                  className={`${styles.palette__item} ${
                    isSelected ? styles['palette__item--selected'] : ''
                  }`}
                  onClick={() => handleSelectItem(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className={styles.palette__itemIcon}>
                    {item.type === 'semantic' ? (
                      <Sparkles size={16} color="var(--color-accent)" />
                    ) : item.type === 'library' ? (
                      <BookOpen size={16} />
                    ) : item.type === 'document' ? (
                      <FileText size={16} />
                    ) : item.type === 'prompt' ? (
                      <Code2 size={16} />
                    ) : (
                      <MessageSquare size={16} />
                    )}
                  </div>
                  <div className={styles.palette__itemContent}>
                    <span className={styles.palette__itemTitle}>{item.title}</span>
                    <span className={styles.palette__itemSubtitle}>{item.subtitle}</span>
                  </div>
                  <span className={styles.palette__typeBadge}>{item.type}</span>
                  <CornerDownLeft size={12} className={styles.palette__enterIcon} />
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hints */}
        <div className={styles.palette__footer}>
          <div className={styles.palette__hintGroup}>
            <kbd>↑</kbd>
            <kbd>↓</kbd>
            <span>to navigate</span>
          </div>
          <div className={styles.palette__hintGroup}>
            <kbd>↵</kbd>
            <span>to select</span>
          </div>
          <div className={styles.palette__hintGroup}>
            <kbd>esc</kbd>
            <span>to dismiss</span>
          </div>
        </div>
      </div>
    </div>
  );
}

