import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  MessageSquare,
  BookOpen,
  FileText,
  Sparkles,
  Settings,
  Cpu,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Search,
  Code2,
  GraduationCap,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';
import styles from './AppLayout.module.scss';
import useUiStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';
import ModeSwitcher from './ModeSwitcher';
import CommandPalette from '../search/CommandPalette';

// Master navigation catalog with mode association
const allNavItems = [
  // Core items
  {
    path: '/chat',
    label: 'AI Chat',
    icon: MessageSquare,
    section: 'WORKSPACE',
    modes: ['general', 'developer', 'student', 'power-user'],
  },
  {
    path: '/library',
    label: 'Knowledge Library',
    icon: BookOpen,
    section: 'WORKSPACE',
    modes: ['general', 'developer', 'student', 'power-user'],
  },
  {
    path: '/documents',
    label: 'Document Studio',
    icon: FileText,
    section: 'SYNTHESIS',
    modes: ['general', 'developer', 'student', 'power-user'],
  },
  {
    path: '/prompts',
    label: 'Prompt Vault',
    icon: Sparkles,
    section: 'SYNTHESIS',
    modes: ['general', 'developer', 'student', 'power-user'],
  },
  {
    path: '/devtools',
    label: 'Developer Utilities',
    icon: Code2,
    section: 'TOOLS',
    modes: ['developer', 'power-user'],
  },
  {
    path: '/focus',
    label: 'Focus & Reminders',
    icon: GraduationCap,
    section: 'TOOLS',
    modes: ['student', 'power-user'],
  },
  {
    path: '/analytics',
    label: 'Usage Analytics',
    icon: BarChart3,
    section: 'INSIGHTS',
    modes: ['power-user'],
  },
  {
    path: '/security',
    label: 'Secrets Vault',
    icon: ShieldCheck,
    section: 'INSIGHTS',
    modes: ['developer', 'power-user'],
  },
  // System items
  {
    path: '/settings',
    label: 'Settings',
    icon: Settings,
    section: 'PREFERENCES',
    modes: ['general', 'developer', 'student', 'power-user'],
  },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    sidebarCollapsed,
    toggleSidebarCollapsed,
    sidebarMode,
  } = useUiStore();

  const { user, logout } = useAuthStore();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Close mobile drawer on route change
  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname, setSidebarOpen]);

  // Global Ctrl+K / Cmd+K shortcut listener
  // Global keyboard shortcut listener for Command Palette (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        console.log('[AppLayout] Command palette shortcut triggered');
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter items by active persona mode
  const visibleItems = allNavItems.filter((item) =>
    item.modes.includes(sidebarMode)
  );

  // Group items by section
  const groupedItems = visibleItems.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  const getPageTitle = () => {
    const activeItem = allNavItems.find(
      (item) =>
        location.pathname === item.path ||
        (item.path === '/chat' && location.pathname === '/')
    );
    return activeItem ? activeItem.label : 'Workspace';
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  const formatModeLabel = (mode) => {
    switch (mode) {
      case 'developer':
        return 'Developer Mode';
      case 'student':
        return 'Student Mode';
      case 'power-user':
        return 'Power-User Mode';
      default:
        return 'General Mode';
    }
  };

  return (
    <div className={styles.layout}>
      {/* Mobile Backdrop */}
      <div
        className={`${styles.layout__backdrop} ${sidebarOpen ? styles['layout__backdrop--visible'] : ''
          }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`${styles.layout__sidebar} ${sidebarOpen ? styles['layout__sidebar--open'] : ''
          } ${sidebarCollapsed ? styles['layout__sidebar--collapsed'] : ''}`}
        aria-label="Application Navigation"
      >
        <div className={styles.layout__brand}>
          <Link to="/" className={styles.layout__brandLink}>
            <img
              src="/favicon.svg"
              alt="NexAI Logo"
              className={styles.layout__logo}
            />
            <span className={styles.layout__brandName}>NexAI</span>
          </Link>
          <button
            type="button"
            onClick={toggleSidebarCollapsed}
            className={styles.layout__collapseToggle}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Persona Mode Switcher */}
        <ModeSwitcher isCollapsed={sidebarCollapsed} />

        {/* Navigation Items grouped by section */}
        <nav className={styles.layout__nav}>
          {Object.entries(groupedItems).map(([section, items]) => (
            <React.Fragment key={section}>
              {!sidebarCollapsed && (
                <div className={styles.layout__navSection}>{section}</div>
              )}
              {items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.path ||
                  (item.path === '/chat' && location.pathname === '/');

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`${styles.layout__navItem} ${isActive ? styles['layout__navItem--active'] : ''
                      }`}
                    title={item.label}
                  >
                    <Icon size={18} className={styles.layout__navIcon} />
                    <span className={styles.layout__navText}>{item.label}</span>
                  </NavLink>
                );
              })}
            </React.Fragment>
          ))}
        </nav>

        {/* User profile section */}
        {user && (
          <div className={styles.layout__userSection}>
            <div className={styles.layout__userProfile} title={user.name}>
              <div className={styles.layout__userAvatar}>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name || 'Avatar'} />
                ) : (
                  userInitial
                )}
              </div>
              <div className={styles.layout__userInfo}>
                <span className={styles.layout__userName}>{user.name || 'User'}</span>
                <span className={styles.layout__userEmail}>{user.email || ''}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className={styles.layout__logoutBtn}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}

        {/* System footer */}
        <div className={styles.layout__footer}>
          <div className={styles.layout__status}>
            <span className={styles.layout__statusDot} />
            <span>Gemini 2.0 Ready</span>
          </div>
          <Cpu size={16} color="var(--text-tertiary)" />
        </div>
      </aside>

      {/* Main Workspace */}
      <div className={styles.layout__main}>
        {/* Header */}
        <header className={styles.layout__header}>
          <div className={styles.layout__headerLeft}>
            <button
              type="button"
              onClick={toggleSidebar}
              className={styles.layout__mobileToggle}
              title="Open Navigation"
              aria-label="Open Navigation"
            >
              <Menu size={20} />
            </button>
            <h1 className={styles.layout__headerTitle}>{getPageTitle()}</h1>
          </div>

          <div className={styles.layout__headerRight}>
            <span className={styles.layout__modeBadge}>
              {formatModeLabel(sidebarMode)}
            </span>

            <button
              type="button"
              className={styles.layout__searchTrigger}
              onClick={() => setCommandPaletteOpen(true)}
              title="Search everything (Ctrl+K)"
            >
              <Search size={14} />
              <span>Search...</span>
              <kbd>Ctrl K</kbd>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className={styles.layout__content}>
          <Outlet />
        </main>
      </div>

      {/* Global Command Palette Modal */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}
