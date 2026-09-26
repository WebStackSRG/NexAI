import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, MessageSquare } from 'lucide-react';
import { ChatHero, MessageThread, ChatInput } from '@/features/chat';
import { IconButton } from '@/components/ui/IconButton';
import { useChatStore } from '@/store/chatStore';
import { ROUTES } from '@/constants/routes';
import styles from './ChatPage.module.scss';

export default function ChatPage() {
  const { chatId } = useParams();
  const navigate = useNavigate();

  const {
    chats,
    activeChatId,
    messages,
    isLoadingMessages,
    fetchChats,
    selectChat,
    createChat,
    sendMessage,
  } = useChatStore();

  const [prefillPrompt, setPrefillPrompt] = useState('');

  // Initial fetch of chats on mount
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Synchronize route param chatId with activeChatId in store
  useEffect(() => {
    if (chatId) {
      if (chatId !== activeChatId) {
        selectChat(chatId);
      }
    } else {
      // Navigated to /chat with no chatId: reset active chat so hero view renders
      if (activeChatId) {
        selectChat(null);
      }
    }
  }, [chatId, activeChatId, selectChat]);

  const handleNewChat = () => {
    selectChat(null);
    navigate(ROUTES.CHAT);
  };

  const handleSendFromHero = async (prompt) => {
    const newChat = await createChat('New Chat');
    if (newChat) {
      navigate(`/chat/${newChat._id}`, { replace: true });
    }
    await sendMessage(prompt);
  };

  const currentChat = chats.find((c) => c._id === activeChatId);
  const pageTitle = currentChat ? currentChat.title : 'AI Chat';

  // Empty chat state renders the minimalist Gemini-inspired Hero view
  const isEmptyChat = !activeChatId || (messages.length === 0 && !isLoadingMessages);

  return (
    <div className={styles.chatContainer} data-testid="chat-page">
      {isEmptyChat ? (
        <ChatHero onSendPrompt={handleSendFromHero} />
      ) : (
        <div className={styles.activeWorkspace}>
          {/* Active Conversation Header */}
          <header className={styles.chatHeader}>
            <div className={styles.headerLeft}>
              <div className={styles.titleInfo}>
                <MessageSquare size={16} className={styles.titleIcon} />
                <h1 className={styles.titleText}>{pageTitle}</h1>
              </div>
            </div>

            <div className={styles.headerRight}>
              <IconButton icon={<Plus size={18} />} label="New Chat" onClick={handleNewChat} />
            </div>
          </header>

          {/* Full-width conversation canvas */}
          <div className={styles.threadArea}>
            <MessageThread
              onSelectSuggestion={(prompt) => setPrefillPrompt(prompt)}
              onEditPrompt={(prompt) => setPrefillPrompt(prompt)}
            />
          </div>

          {/* Pinned bottom composer */}
          <div className={styles.inputArea}>
            <ChatInput prefillValue={prefillPrompt} onClearPrefill={() => setPrefillPrompt('')} />
          </div>
        </div>
      )}
    </div>
  );
}
