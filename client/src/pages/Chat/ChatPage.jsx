import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { ChatHero, MessageThread, ChatInput } from '@/features/chat';
import { useChatStore } from '@/store/chatStore';
import styles from './ChatPage.module.scss';

export default function ChatPage() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

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

  // Handle prefill prompt from navigation state (e.g. Prompt Vault "Use in Chat")
  useEffect(() => {
    if (location.state?.prefill) {
      setPrefillPrompt(location.state.prefill);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

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

  const handleSendFromHero = async (prompt, attachments = []) => {
    const newChat = await createChat('New Chat');
    if (newChat) {
      navigate(`/chat/${newChat._id}`, { replace: true });
    }
    await sendMessage(prompt, attachments);
  };

  const currentChat = chats.find((c) => c._id === activeChatId);
  const pageTitle = currentChat ? currentChat.title : 'AI Chat';

  // Empty chat state renders the minimalist Gemini-inspired Hero view
  const isEmptyChat = !activeChatId || (messages.length === 0 && !isLoadingMessages);

  return (
    <div className={styles.chatContainer} data-testid="chat-page">
      {isEmptyChat ? (
        <ChatHero
          onSendPrompt={handleSendFromHero}
          initialPrompt={prefillPrompt}
          onClearInitialPrompt={() => setPrefillPrompt('')}
        />
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
          </header>

          {/* Full-width conversation canvas */}
          <div className={styles.threadArea}>
            <MessageThread
              onSelectSuggestion={(prompt) => sendMessage(prompt)}
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
