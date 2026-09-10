import React, { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Plus,
  Search,
  Pin,
  Trash2,
  Edit2,
  Send,
  Square,
  Sparkles,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import styles from './ChatPage.module.scss';
import useChatStore from '../../store/chatStore';
import useAuthStore from '../../store/authStore';
import ChatMessage from '../../components/chat/ChatMessage';

const promptStarters = [
  'Explain how Server-Sent Events (SSE) work in Node.js and React.',
  'Design a zero-knowledge encryption vault with AES-GCM and PBKDF2.',
  'Write a clean Mongoose schema for vectorized documents with Pinecone.',
  'How do I build a responsive split-pane markdown document studio?',
];

export default function ChatPage() {
  const [input, setInput] = useState('');
  const { messages } = useChatStore();
  const location = useLocation();
  const {
    chats,
    activeChatId,
    messages,
    isStreaming,
    streamingText,
    streamingSources,
    fetchChats,
    selectChat,
    createNewChat,
    renameChat,
    togglePinChat,
    deleteChat,
    sendMessage,
    cancelStream,
  } = useChatStore();

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setInput('');
  const { user } = useAuthStore();

  const [inputContent, setInputContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSessionsOpen, setMobileSessionsOpen] = useState(false);
  const [editingTitleId, setEditingTitleId] = useState(null);
  const [editTitleValue, setEditTitleValue] = useState('');

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Load chats and handle injected draft prompt from Prompt Vault
  useEffect(() => {
    fetchChats();
    if (location.state?.draftMessage) {
      setInputContent(location.state.draftMessage);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [fetchChats, location.state]);

  // Auto-scroll to bottom as messages or streaming text updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // Auto-adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        160
      )}px`;
    }
  }, [inputContent]);

  const activeChat = chats.find((c) => (c._id || c.id) === activeChatId);

  const handleSend = () => {
    if (!inputContent.trim() || isStreaming) return;
    sendMessage(inputContent);
    setInputContent('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStartEditingTitle = (chat) => {
    setEditingTitleId(chat._id || chat.id);
    setEditTitleValue(chat.title);
  };

  const handleSaveTitle = (chatId) => {
    if (editTitleValue.trim()) {
      renameChat(chatId, editTitleValue.trim());
    }
    setEditingTitleId(null);
  };

  const handleDeleteChat = (chatId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      deleteChat(chatId);
    }
  };

  // Filtered chats by search query
  const filteredChats = chats.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedChats = filteredChats.filter((c) => c.pinned);
  const recentChats = filteredChats.filter((c) => !c.pinned);

  return (
    <div className={styles.chat}>
      <div className={styles.chat__hero}>
        <div className={styles.chat__badge}>
          <Sparkles size={14} />
          <span>Gemini 2.0 Flash</span>
    <div className={styles.chatContainer}>
      {/* ── Left Sessions Sidebar ────────────────────────────── */}
      <aside
        className={`${styles.sessionsSidebar} ${
          mobileSessionsOpen ? styles['sessionsSidebar--mobileOpen'] : ''
        }`}
      >
        <div className={styles.sessionsSidebar__header}>
          <button
            type="button"
            onClick={() => {
              createNewChat();
              setMobileSessionsOpen(false);
            }}
            className={styles.sessionsSidebar__newBtn}
          >
            <Plus size={16} />
            <span>New Chat</span>
          </button>
        </div>
        <h2 className={styles.chat__title}>How can NexAI assist you today?</h2>
        <p className={styles.chat__subtitle}>
          Ask anything, search your personal library, or generate comprehensive structured documents.
        </p>
      </div>

      <form className={styles.chat__inputStub} onSubmit={handleSend}>
        <input
          type="text"
          className={styles.chat__input}
          placeholder="Message NexAI or ask about your library..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className={styles.chat__sendButton} aria-label="Send message">
          <Send size={16} />
        </button>
      </form>
        <div className={styles.sessionsSidebar__search}>
          <Search size={14} color="var(--text-tertiary)" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.sessionsSidebar__list}>
          {pinnedChats.length > 0 && (
            <>
              <div className={styles.sessionsSidebar__sectionTitle}>Pinned</div>
              {pinnedChats.map((c) => {
                const cid = c._id || c.id;
                const isActive = activeChatId === cid;
                return (
                  <div
                    key={cid}
                    onClick={() => {
                      selectChat(cid);
                      setMobileSessionsOpen(false);
                    }}
                    className={`${styles.sessionsSidebar__item} ${
                      isActive ? styles['sessionsSidebar__item--active'] : ''
                    }`}
                  >
                    <span className={styles.sessionsSidebar__itemTitle}>
                      {c.title}
                    </span>
                    <div className={styles.sessionsSidebar__actions}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePinChat(cid);
                        }}
                        className={`${styles.sessionsSidebar__actionBtn} ${styles['sessionsSidebar__actionBtn--pinned']}`}
                        title="Unpin"
                      >
                        <Pin size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteChat(cid, e)}
                        className={styles.sessionsSidebar__actionBtn}
                        title="Delete chat"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          <div className={styles.sessionsSidebar__sectionTitle}>
            {pinnedChats.length > 0 ? 'Recent' : 'All Conversations'}
          </div>

          {recentChats.length === 0 && pinnedChats.length === 0 ? (
            <div
              style={{
                padding: 'var(--space-4)',
                textAlign: 'center',
                color: 'var(--text-tertiary)',
                fontSize: 'var(--text-xs)',
              }}
            >
              No conversations found.
            </div>
          ) : (
            recentChats.map((c) => {
              const cid = c._id || c.id;
              const isActive = activeChatId === cid;
              return (
                <div
                  key={cid}
                  onClick={() => {
                    selectChat(cid);
                    setMobileSessionsOpen(false);
                  }}
                  className={`${styles.sessionsSidebar__item} ${
                    isActive ? styles['sessionsSidebar__item--active'] : ''
                  }`}
                >
                  <span className={styles.sessionsSidebar__itemTitle}>
                    {c.title}
                  </span>
                  <div className={styles.sessionsSidebar__actions}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePinChat(cid);
                      }}
                      className={styles.sessionsSidebar__actionBtn}
                      title="Pin chat"
                    >
                      <Pin size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteChat(cid, e)}
                      className={styles.sessionsSidebar__actionBtn}
                      title="Delete chat"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ── Main Chat Pane ───────────────────────────────────── */}
      <section className={styles.chatMain}>
        <div className={styles.chatMain__header}>
          <div className={styles.chatMain__headerLeft}>
            <button
              type="button"
              onClick={() => setMobileSessionsOpen(!mobileSessionsOpen)}
              className={styles.chatMain__sidebarToggle}
              title="Toggle sessions list"
            >
              {mobileSessionsOpen ? (
                <PanelLeftClose size={18} />
              ) : (
                <PanelLeftOpen size={18} />
              )}
            </button>

            {editingTitleId && activeChat ? (
              <input
                type="text"
                value={editTitleValue}
                onChange={(e) => setEditTitleValue(e.target.value)}
                onBlur={() => handleSaveTitle(editingTitleId)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle(editingTitleId)}
                autoFocus
                className={styles.chatMain__titleInput}
              />
            ) : (
              <h2
                className={styles.chatMain__title}
                onClick={() => activeChat && handleStartEditingTitle(activeChat)}
                title="Click to rename"
              >
                <span>{activeChat ? activeChat.title : 'New Chat'}</span>
                <Edit2 size={13} color="var(--text-tertiary)" />
              </h2>
            )}
          </div>

          <div className={styles.chatMain__headerRight}>
            <div className={styles.chatMain__modelTag}>
              <Sparkles size={11} color="var(--color-accent)" />
              <span>Gemini 2.0 Flash</span>
            </div>
          </div>
        </div>

        {/* ── Message Thread ─────────────────────────────────── */}
        <div className={styles.chatMain__thread}>
          {messages.length === 0 && !isStreaming ? (
            <div className={styles.chatMain__emptyState}>
              <div className={styles.chatMain__emptyBadge}>
                <Sparkles size={13} />
                <span>Next-Generation Streaming</span>
              </div>
              <h1 className={styles.chatMain__emptyTitle}>
                What would you like to build or explore today?
              </h1>
              <p className={styles.chatMain__emptySubtitle}>
                NexAI combines high-speed Gemini 2.0 Flash reasoning with your
                knowledge workspace. Select a starter or type a question below.
              </p>

              <div className={styles.chatMain__startersGrid}>
                {promptStarters.map((starter, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => sendMessage(starter)}
                    className={styles.chatMain__starterChip}
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <ChatMessage
                  key={msg._id || msg.id}
                  role={msg.role}
                  content={msg.content}
                  sources={msg.sources || msg.toolCalls?.[0]?.output?.sources || []}
                  model={msg.model}
                  latencyMs={msg.latencyMs}
                  createdAt={msg.createdAt}
                  userName={user?.name || 'You'}
                  userAvatar={user?.avatar}
                />
              ))}

              {isStreaming && (
                <ChatMessage
                  key="active-stream"
                  role="assistant"
                  content={streamingText}
                  sources={activeSources}
                  isStreaming={true}
                  model="gemini-2.0-flash"
                />
              )}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Bottom Input Dock ──────────────────────────────── */}
        <div className={styles.chatMain__inputDock}>
          <div className={styles.chatMain__inputBox}>
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Ask NexAI anything... (Shift + Enter for new line)"
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className={styles.chatMain__textarea}
            />

            <div className={styles.chatMain__inputControls}>
              <span className={styles.chatMain__inputMeta}>
                Gemini 2.0 Flash • Press Enter to send
              </span>

              <div className={styles.chatMain__sendGroup}>
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={cancelStream}
                    className={styles.chatMain__stopBtn}
                    title="Stop generating"
                  >
                    <Square size={12} fill="currentColor" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!inputContent.trim()}
                    className={styles.chatMain__sendBtn}
                    title="Send message"
                  >
                    <Send size={15} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
