import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PanelLeft, Plus, MessageSquare } from 'lucide-react';
import { ChatSidebar, MessageThread, ChatInput } from '@/features/chat';
import { IconButton } from '@/components/ui/IconButton';
import { Drawer } from '@/components/ui/Drawer';
import { useChatStore } from '@/store/chatStore';
import styles from './ChatPage.module.scss';

export default function ChatPage() {
  const { chatId } = useParams();
  const navigate = useNavigate();

  const { chats, activeChatId, fetchChats, selectChat, createChat } = useChatStore();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [prefillPrompt, setPrefillPrompt] = useState('');

  // Initial fetch of chats on mount
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Synchronize route param chatId with activeChatId in store
  useEffect(() => {
    if (chatId && chatId !== activeChatId) {
      selectChat(chatId);
    }
  }, [chatId, activeChatId, selectChat]);

  const handleSelectChat = (id) => {
    navigate(`/chat/${id}`);
    setMobileSidebarOpen(false);
  };

  const handleNewChat = async () => {
    const newChat = await createChat('New Chat');
    if (newChat) {
      navigate(`/chat/${newChat._id}`);
      setMobileSidebarOpen(false);
    }
  };

  const currentChat = chats.find((c) => c._id === activeChatId);
  const pageTitle = currentChat ? currentChat.title : 'AI Chat';

  return (
    <div className={styles.chatPage}>
      {/* Desktop Chat Sidebar */}
      <div className={styles.desktopSidebar}>
        <ChatSidebar onSelectChat={handleSelectChat} />
      </div>

      {/* Mobile Drawer Chat Sidebar */}
      <Drawer
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        title="Conversations"
        side="left"
      >
        <ChatSidebar onSelectChat={handleSelectChat} />
      </Drawer>

      {/* Main Chat Workspace */}
      <div className={styles.mainWorkspace}>
        <header className={styles.chatHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.mobileToggle}>
              <IconButton
                icon={<PanelLeft size={18} />}
                label="Toggle chat history"
                onClick={() => setMobileSidebarOpen(true)}
              />
            </div>
            <div className={styles.titleInfo}>
              <MessageSquare size={16} className={styles.titleIcon} />
              <h1 className={styles.titleText}>{pageTitle}</h1>
            </div>
          </div>

          <div className={styles.headerRight}>
            <IconButton icon={<Plus size={18} />} label="New Chat" onClick={handleNewChat} />
          </div>
        </header>

        <div className={styles.threadArea}>
          <MessageThread
            onSelectSuggestion={(prompt) => setPrefillPrompt(prompt)}
            onEditPrompt={(prompt) => setPrefillPrompt(prompt)}
          />
        </div>

        <div className={styles.inputArea}>
          <ChatInput prefillValue={prefillPrompt} onClearPrefill={() => setPrefillPrompt('')} />
        </div>
      </div>
    </div>
  );
}
