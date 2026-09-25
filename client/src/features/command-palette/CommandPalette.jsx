import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MessageSquare,
  Bookmark,
  FileText,
  Terminal,
  Wallet,
  Settings,
  Shield,
  SunMoon,
} from 'lucide-react';
import { useHotkey } from '@/hooks/useHotkey';
import { useUiStore } from '@/store/uiStore';
import { Kbd } from '@/components/ui/Kbd';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils/cn';
import styles from './CommandPalette.module.scss';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const inputRef = useRef(null);

  // Ctrl+K or Cmd+K toggles palette
  useHotkey('ctrl+k', () => setOpen((prev) => !prev));
  useHotkey('cmd+k', () => setOpen((prev) => !prev));
  useHotkey('escape', () => setOpen(false), { disabled: !open });

  const commands = [
    {
      id: 'chat',
      label: 'New Chat',
      category: 'Navigation',
      icon: <MessageSquare size={16} />,
      perform: () => navigate(ROUTES.CHAT),
    },
    {
      id: 'library',
      label: 'Personal Library',
      category: 'Navigation',
      icon: <Bookmark size={16} />,
      perform: () => navigate(ROUTES.LIBRARY),
    },
    {
      id: 'documents',
      label: 'Document Generator',
      category: 'Navigation',
      icon: <FileText size={16} />,
      perform: () => navigate(ROUTES.DOCUMENTS),
    },
    {
      id: 'prompts',
      label: 'Prompt Vault',
      category: 'Navigation',
      icon: <Terminal size={16} />,
      perform: () => navigate(ROUTES.PROMPTS),
    },
    {
      id: 'search',
      label: 'Unified Search',
      category: 'Navigation',
      icon: <Search size={16} />,
      perform: () => navigate(ROUTES.SEARCH),
    },
    {
      id: 'wallet',
      label: 'Wallet & Billing',
      category: 'Navigation',
      icon: <Wallet size={16} />,
      perform: () => navigate(ROUTES.WALLET),
    },
    {
      id: 'settings',
      label: 'Settings',
      category: 'Navigation',
      icon: <Settings size={16} />,
      perform: () => navigate(ROUTES.SETTINGS),
    },
    {
      id: 'admin',
      label: 'Admin Dashboard',
      category: 'Navigation',
      icon: <Shield size={16} />,
      perform: () => navigate(ROUTES.ADMIN),
    },
    {
      id: 'theme',
      label: 'Toggle Theme (Light / Dark)',
      category: 'Preferences',
      icon: <SunMoon size={16} />,
      perform: () => toggleTheme(),
    },
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].perform();
        setOpen(false);
      }
    }
  };

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div className={styles.palette}>
        <div className={styles.searchHeader}>
          <Search size={18} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className={styles.input}
          />
          <Kbd>Esc</Kbd>
        </div>

        <div className={styles.list} role="listbox">
          {filteredCommands.length === 0 ? (
            <div className={styles.empty}>No matching commands</div>
          ) : (
            filteredCommands.map((cmd, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  role="option"
                  aria-selected={isSelected}
                  className={cn(styles.item, isSelected && styles.active)}
                  onClick={() => {
                    cmd.perform();
                    setOpen(false);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className={styles.itemLeft}>
                    {cmd.icon}
                    <span>{cmd.label}</span>
                  </div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    {cmd.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <div className={styles.footer}>
          <span className={styles.hint}>
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> Navigate
          </span>
          <span className={styles.hint}>
            <Kbd>↵</Kbd> Select
          </span>
          <span className={styles.hint}>
            <Kbd>Esc</Kbd> Close
          </span>
        </div>
      </div>
    </div>
  );
}
