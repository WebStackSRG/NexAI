import { useState } from 'react';
import PropTypes from 'prop-types';
import { Plus, MessageSquare, MoreVertical, Edit2, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Dropdown } from '@/components/ui/Dropdown';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useChatStore } from '@/store/chatStore';
import { cn } from '@/lib/utils/cn';
import styles from './ChatSidebar.module.scss';

export function ChatSidebar({ onSelectChat, className }) {
  const { chats, activeChatId, isLoadingChats, createChat, updateChatTitle, deleteChat } =
    useChatStore();

  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingChatId, setDeletingChatId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    await deleteChat(deletingChatId);
    setIsDeleting(false);
    setDeletingChatId(null);
  };

  const handleNewChat = async () => {
    const newChat = await createChat('New Chat');
    if (newChat && onSelectChat) {
      onSelectChat(newChat._id);
    }
  };

  return (
    <aside className={cn(styles.sidebar, className)} aria-label="Chat conversations">
      <div className={styles.header}>
        <Button variant="primary" leftIcon={<Plus size={16} />} fullWidth onClick={handleNewChat}>
          New Chat
        </Button>
      </div>

      <div className={styles.chatList}>
        {isLoadingChats ? (
          <div className={styles.skeletonList}>
            <Skeleton height="44px" radius="md" />
            <Skeleton height="44px" radius="md" />
            <Skeleton height="44px" radius="md" />
          </div>
        ) : chats.length === 0 ? (
          <div className={styles.emptyState}>
            <MessageSquare size={24} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>No conversations yet</p>
            <p className={styles.emptySubtitle}>Start a chat to get started</p>
          </div>
        ) : (
          chats.map((chat) => {
            const isActive = chat._id === activeChatId;
            const isEditing = chat._id === editingChatId;

            return (
              <div
                key={chat._id}
                className={cn(styles.chatItem, isActive && styles.active)}
                onClick={() => {
                  if (!isEditing && onSelectChat) {
                    onSelectChat(chat._id);
                  }
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isEditing && onSelectChat) {
                    onSelectChat(chat._id);
                  }
                }}
              >
                <MessageSquare size={16} className={styles.itemIcon} />

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
                      className={styles.actionBtn}
                      onClick={(e) => handleSaveRename(chat._id, e)}
                      aria-label="Save title"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={handleCancelRename}
                      aria-label="Cancel rename"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className={styles.chatTitle} title={chat.title}>
                      {chat.title}
                    </span>

                    <div className={styles.itemActions} onClick={(e) => e.stopPropagation()}>
                      <Dropdown
                        trigger={
                          <IconButton
                            icon={<MoreVertical size={14} />}
                            label="Chat options"
                            size="sm"
                            variant="ghost"
                          />
                        }
                        items={[
                          {
                            label: 'Rename',
                            icon: <Edit2 size={14} />,
                            onClick: (e) => handleStartRename(chat, e),
                          },
                          { divider: true },
                          {
                            label: 'Delete',
                            icon: <Trash2 size={14} />,
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

ChatSidebar.propTypes = {
  onSelectChat: PropTypes.func,
  className: PropTypes.string,
};
