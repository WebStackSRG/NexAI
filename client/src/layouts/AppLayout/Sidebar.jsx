import { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  SquarePen,
  Search,
  MessageSquare,
  Bookmark,
  Terminal,
  Mic,
  Wallet,
  Settings,
  Shield,
  Layers,
  LogOut,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  MoreHorizontal,
  Edit2,
  Trash2,
  Check,
  Zap,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown } from '@/components/ui/Dropdown';
import { IconButton } from '@/components/ui/IconButton';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useUiStore } from '@/store/uiStore';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils/cn';
import styles from './Sidebar.module.scss';

export function Sidebar({ onItemClick, isMobile = false }) {
  const { user, logout } = useAuthStore();
  const {
    chats,
    activeChatId,
    isLoadingChats,
    fetchChats,
    selectChat,
    updateChatTitle,
    deleteChat,
  } = useChatStore();

  const isCollapsedInStore = useUiStore((state) => state.isSidebarCollapsed);
  const toggleSidebarCollapsed = useUiStore((state) => state.toggleSidebarCollapsed);

  // If inside mobile drawer, never show collapsed rail
  const isCollapsed = isMobile ? false : isCollapsedInStore;

  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingChatId, setDeletingChatId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initial fetch of chat list
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Primary navigation links
  const navItems = [
    { to: ROUTES.CHAT, label: 'Chat', icon: <MessageSquare size={17} /> },
    { to: ROUTES.LIBRARY, label: 'Library', icon: <Bookmark size={17} /> },
    { to: ROUTES.PROMPTS, label: 'Prompts', icon: <Terminal size={17} /> },
    { to: ROUTES.INTERVIEW, label: 'Interview', icon: <Mic size={17} /> },
    { to: ROUTES.WALLET, label: 'Wallet', icon: <Wallet size={17} /> },
    { to: ROUTES.SETTINGS, label: 'Settings', icon: <Settings size={17} /> },
  ];

  // Role-gated: Admin [if admin]
  if (user?.role === 'admin') {
    navItems.push({
      to: ROUTES.ADMIN,
      label: 'Admin',
      icon: <Shield size={17} />,
    });
  }

  // Dev-only Design System Link
  if (import.meta.env.DEV) {
    navItems.push({
      to: ROUTES.DESIGN_SYSTEM,
      label: 'Design System',
      icon: <Layers size={17} />,
    });
  }

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const query = searchQuery.toLowerCase();
    return chats.filter((c) => c.title?.toLowerCase().includes(query));
  }, [chats, searchQuery]);

  const handleNewChat = () => {
    selectChat(null);
    navigate(ROUTES.CHAT);
    onItemClick?.();
  };

  const handleSelectChat = (chatId) => {
    selectChat(chatId);
    navigate(`/chat/${chatId}`);
    onItemClick?.();
  };

  const handleStartRename = (chat, e) => {
    e?.stopPropagation();
    setEditingChatId(chat._id);
    setEditTitle(chat.title);
  };

  const handleSaveRename = async (chatId, e) => {
    e?.stopPropagation();
    if (editTitle.trim()) {
      await updateChatTitle(chatId, editTitle.trim());
    }
    setEditingChatId(null);
  };

  const handleCancelRename = (e) => {
    e?.stopPropagation();
    setEditingChatId(null);
  };

  const handleStartDelete = (chatId, e) => {
    e?.stopPropagation();
    setDeletingChatId(chatId);
  };

  const handleConfirmDelete = async () => {
    if (!deletingChatId) return;
    setIsDeleting(true);
    const wasActive = activeChatId === deletingChatId;
    await deleteChat(deletingChatId);
    setIsDeleting(false);
    setDeletingChatId(null);

    // If active chat was deleted and user is viewing it, navigate to /chat
    if (wasActive && location.pathname.startsWith('/chat/')) {
      navigate(ROUTES.CHAT);
    }
  };

  const openCommandPalette = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
  };

  const credits = user?.wallet?.creditsRemaining ?? 100;
  const userDisplayName = user?.email ? user.email.split('@')[0] : 'User';
  const userPlan =
    user?.role === 'admin'
      ? 'Admin'
      : user?.wallet?.tier === 'pro_monthly'
        ? 'Pro Tier'
        : 'Free Tier';

  const userMenuItems = [
    {
      label: `Recharge (${credits} credits remaining)`,
      icon: <Zap size={15} />,
      onClick: () => {
        onItemClick?.();
        navigate(ROUTES.WALLET);
      },
    },
    {
      label: 'Settings',
      icon: <Settings size={15} />,
      onClick: () => {
        onItemClick?.();
        navigate(ROUTES.SETTINGS);
      },
    },
    { divider: true },
    {
      label: 'Sign Out',
      icon: <LogOut size={15} />,
      danger: true,
      onClick: async () => {
        onItemClick?.();
        await logout();
        navigate(ROUTES.LOGIN);
      },
    },
  ];

  return (
    <aside
      className={cn(styles.sidebar, isCollapsed && styles.collapsed, isMobile && styles.mobile)}
      aria-label="Sidebar navigation"
    >
      {/* Brand Header */}
      <div className={styles.brandHeader}>
        {isCollapsed ? (
          <IconButton
            icon={<PanelLeftOpen size={18} />}
            label="Expand sidebar"
            size="sm"
            variant="ghost"
            onClick={toggleSidebarCollapsed}
            className={styles.collapsedToggleBtn}
          />
        ) : (
          <>
            <div
              className={styles.brandTitle}
              onClick={() => {
                onItemClick?.();
                navigate(ROUTES.CHAT);
              }}
              role="button"
              tabIndex={0}
              title="NexAI"
            >
              NexAI
            </div>

            <div className={styles.headerActions}>
              <IconButton
                icon={<Search size={17} />}
                label="Search workspace"
                size="sm"
                variant="ghost"
                onClick={openCommandPalette}
                className={styles.headerActionBtn}
              />
              {!isMobile && (
                <IconButton
                  icon={<PanelLeftClose size={18} />}
                  label="Collapse sidebar"
                  size="sm"
                  variant="ghost"
                  onClick={toggleSidebarCollapsed}
                  className={styles.headerActionBtn}
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* Primary Action: New chat */}
      <div className={styles.newChatWrapper}>
        {isCollapsed ? (
          <IconButton
            icon={<SquarePen size={18} />}
            label="New chat"
            variant="ghost"
            size="md"
            onClick={handleNewChat}
            className={styles.collapsedNewChatBtn}
          />
        ) : (
          <button
            type="button"
            className={styles.expandedNewChatBtn}
            onClick={handleNewChat}
            aria-label="New chat"
          >
            <SquarePen size={17} className={styles.newChatIcon} />
            <span>New chat</span>
          </button>
        )}
      </div>

      {/* Primary Navigation Links */}
      <nav className={styles.navSection} aria-label="Main Navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onItemClick}
            title={isCollapsed ? item.label : undefined}
            className={({ isActive }) => cn(styles.navItem, isActive && styles.active)}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Recent Chat History List (expanded only) */}
      {!isCollapsed && (
        <div className={styles.recentsSection}>
          <div className={styles.recentsHeader}>
            <span className={styles.recentsTitle}>Chats</span>
            {chats.length > 0 && <span className={styles.recentsCount}>{chats.length}</span>}
          </div>

          {/* Search chats live filter */}
          <div className={styles.searchWrapper}>
            <Search size={13} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              aria-label="Search chats"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={styles.clearSearch}
                aria-label="Clear chat search"
              >
                <X size={11} />
              </button>
            )}
          </div>

          <div className={styles.recentsList} role="list" aria-label="Recent chats">
            {isLoadingChats ? (
              <div className={styles.skeletonList}>
                <Skeleton height="32px" radius="md" />
                <Skeleton height="32px" radius="md" />
                <Skeleton height="32px" radius="md" />
              </div>
            ) : chats.length === 0 ? (
              <div className={styles.emptyRecents}>
                <p>No conversations yet</p>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className={styles.noMatch}>
                <p>No chats matching &quot;{searchQuery}&quot;</p>
              </div>
            ) : (
              filteredChats.map((chat) => {
                const isActive = chat._id === activeChatId;
                const isEditing = chat._id === editingChatId;

                return (
                  <div
                    key={chat._id}
                    className={cn(styles.chatItem, isActive && styles.active)}
                    onClick={() => {
                      if (!isEditing) {
                        handleSelectChat(chat._id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isEditing) {
                        handleSelectChat(chat._id);
                      }
                    }}
                  >
                    {isEditing ? (
                      <div className={styles.editRow} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          className={styles.editInput}
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(chat._id, e);
                            if (e.key === 'Escape') handleCancelRename(e);
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          className={styles.inlineActionBtn}
                          onClick={(e) => handleSaveRename(chat._id, e)}
                          aria-label="Save title"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          type="button"
                          className={styles.inlineActionBtn}
                          onClick={handleCancelRename}
                          aria-label="Cancel rename"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className={styles.chatTitle} title={chat.title}>
                          {chat.title}
                        </span>

                        <div className={styles.chatActions} onClick={(e) => e.stopPropagation()}>
                          <Dropdown
                            trigger={
                              <IconButton
                                icon={<MoreHorizontal size={15} />}
                                label="Chat options"
                                size="sm"
                                variant="ghost"
                                className={styles.itemMenuBtn}
                              />
                            }
                            items={[
                              {
                                label: 'Rename',
                                icon: <Edit2 size={13} />,
                                onClick: (e) => handleStartRename(chat, e),
                              },
                              { divider: true },
                              {
                                label: 'Delete',
                                icon: <Trash2 size={13} />,
                                danger: true,
                                onClick: (e) => handleStartDelete(chat._id, e),
                              },
                            ]}
                            align="right"
                          />
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* User Wallet Badge Card Footer (ChatGPT Style) */}
      <div className={styles.footerSection}>
        {!isCollapsed ? (
          <Dropdown
            trigger={
              <div
                className={styles.userCard}
                role="button"
                tabIndex={0}
                aria-label="User account menu"
              >
                <Avatar name={user?.email || 'User'} size="sm" />
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{userDisplayName}</span>
                  <span className={styles.userPlan}>{userPlan}</span>
                </div>
                <div className={styles.creditChip} title={`${credits} credits remaining`}>
                  <Zap size={11} className={styles.creditIcon} />
                  <span>{credits}</span>
                </div>
              </div>
            }
            items={userMenuItems}
            align="left"
          />
        ) : (
          <div className={styles.collapsedFooter}>
            <Dropdown
              trigger={
                <div
                  className={styles.collapsedUserAvatar}
                  role="button"
                  tabIndex={0}
                  title={`${userDisplayName} (${userPlan}) - ${credits} credits`}
                >
                  <Avatar name={user?.email || 'User'} size="sm" />
                </div>
              }
              items={userMenuItems}
              align="left"
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deletingChatId)}
        title="Delete conversation?"
        description="This will permanently delete this conversation and all its messages. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingChatId(null)}
      />
    </aside>
  );
}

Sidebar.propTypes = {
  onItemClick: PropTypes.func,
  isMobile: PropTypes.bool,
};
