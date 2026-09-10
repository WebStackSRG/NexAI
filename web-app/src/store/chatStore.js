import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import apiClient from '../lib/apiClient';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const useChatStore = create(
  devtools(
    (set, get) => ({
      chats: [],
      activeChatId: null,
      messages: [],
      isStreaming: false,
      streamingText: '',
      isLoadingChats: false,
      isLoadingMessages: false,
      error: null,
      abortController: null,

      // Load all chats for user
      fetchChats: async () => {
        set({ isLoadingChats: true, error: null });
        try {
          const res = await apiClient.get('/chat');
          const chats = res.data.chats || [];
          set({ chats, isLoadingChats: false });

          // If no active chat but chats exist, select first chat
          const currentActive = get().activeChatId;
          if (!currentActive && chats.length > 0) {
            get().selectChat(chats[0]._id || chats[0].id);
          }
        } catch (err) {
          set({
            error: err.response?.data?.error || 'Failed to load chat history',
            isLoadingChats: false,
          });
        }
      },

      // Select and load specific chat session
      selectChat: async (chatId) => {
        if (!chatId) {
          set({ activeChatId: null, messages: [] });
          return;
        }

        set({ activeChatId: chatId, isLoadingMessages: true, error: null });
        try {
          const res = await apiClient.get(`/chat/${chatId}`);
          set({
            messages: res.data.messages || [],
            isLoadingMessages: false,
          });
        } catch (err) {
          set({
            error: err.response?.data?.error || 'Failed to load messages',
            isLoadingMessages: false,
          });
        }
      },

      // Start fresh chat session
      createNewChat: async () => {
        try {
          const res = await apiClient.post('/chat', { title: 'New Chat' });
          const newChat = res.data.chat;
          set((s) => ({
            chats: [newChat, ...s.chats],
            activeChatId: newChat._id || newChat.id,
            messages: [],
            streamingText: '',
            isStreaming: false,
            error: null,
          }));
          return newChat;
        } catch (err) {
          set({ error: 'Failed to create new chat session' });
        }
      },

      // Rename chat session
      renameChat: async (chatId, title) => {
        if (!title || !title.trim()) return;
        const prevChats = get().chats;
        // Optimistic update
        set((s) => ({
          chats: s.chats.map((c) =>
            (c._id || c.id) === chatId ? { ...c, title: title.trim() } : c
          ),
        }));

        try {
          await apiClient.patch(`/chat/${chatId}`, { title: title.trim() });
        } catch (err) {
          // Rollback on failure
          set({ chats: prevChats, error: 'Failed to rename chat' });
        }
      },

      // Toggle pinned state
      togglePinChat: async (chatId) => {
        const chat = get().chats.find((c) => (c._id || c.id) === chatId);
        if (!chat) return;
        const newPinned = !chat.pinned;

        // Optimistic update & re-sort
        set((s) => {
          const updated = s.chats.map((c) =>
            (c._id || c.id) === chatId ? { ...c, pinned: newPinned } : c
          );
          updated.sort((a, b) => {
            if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
            return new Date(b.updatedAt) - new Date(a.updatedAt);
          });
          return { chats: updated };
        });

        try {
          await apiClient.patch(`/chat/${chatId}`, { pinned: newPinned });
        } catch (err) {
          get().fetchChats();
        }
      },

      // Delete chat session
      deleteChat: async (chatId) => {
        const prevChats = get().chats;
        const isActive = get().activeChatId === chatId;

        // Optimistic remove
        set((s) => {
          const remaining = s.chats.filter((c) => (c._id || c.id) !== chatId);
          return {
            chats: remaining,
            activeChatId: isActive
              ? remaining.length > 0
                ? remaining[0]._id || remaining[0].id
                : null
              : s.activeChatId,
            messages: isActive ? [] : s.messages,
          };
        });

        try {
          await apiClient.delete(`/chat/${chatId}`);
          if (isActive && get().activeChatId) {
            get().selectChat(get().activeChatId);
          }
        } catch (err) {
          set({ chats: prevChats, error: 'Failed to delete chat session' });
        }
      },

      // Cancel ongoing streaming response
      cancelStream: () => {
        const controller = get().abortController;
        if (controller) {
          controller.abort();
        }
        const text = get().streamingText;
        if (text) {
          // Save partial content as assistant message
          set((s) => ({
            messages: [
              ...s.messages,
              {
                _id: `partial-${Date.now()}`,
                role: 'assistant',
                content: text + ' *(Generation paused)*',
                createdAt: new Date().toISOString(),
              },
            ],
            isStreaming: false,
            streamingText: '',
            abortController: null,
          }));
        } else {
          set({ isStreaming: false, streamingText: '', abortController: null });
        }
      },

      // Send message via Server-Sent Events (SSE)
      sendMessage: async (content) => {
        if (!content || !content.trim() || get().isStreaming) return;

        const trimmedContent = content.trim();
        let chatId = get().activeChatId;
        const controller = new AbortController();

        // Optimistic temporary user message
        const tempUserMsg = {
          _id: `temp-${Date.now()}`,
          role: 'user',
          content: trimmedContent,
          createdAt: new Date().toISOString(),
        };

        set((s) => ({
          messages: [...s.messages, tempUserMsg],
          isStreaming: true,
          streamingText: '',
          abortController: controller,
          error: null,
        }));

        try {
          const response = await fetch(`${API_BASE}/chat/message`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chatId: chatId || undefined,
              content: trimmedContent,
            }),
            signal: controller.signal,
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Server responded with ${response.status}`);
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let buffer = '';
          let accumulatedText = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine.startsWith('data: ')) {
                try {
                  const event = JSON.parse(trimmedLine.slice(6));

                  if (event.type === 'session_init') {
                    const sessionChat = event.chat;
                    if (sessionChat) {
                      const sid = sessionChat._id || sessionChat.id;
                      set((s) => {
                        const exists = s.chats.some((c) => (c._id || c.id) === sid);
                        return {
                          activeChatId: sid,
                          chats: exists ? s.chats : [sessionChat, ...s.chats],
                        };
                      });
                    }
                  } else if (event.type === 'chunk') {
                    accumulatedText += event.chunk;
                    set({ streamingText: accumulatedText });
                  } else if (event.type === 'chat_updated') {
                    const updatedChat = event.chat;
                    if (updatedChat) {
                      set((s) => ({
                        chats: s.chats.map((c) =>
                          (c._id || c.id) === (updatedChat._id || updatedChat.id)
                            ? updatedChat
                            : c
                        ),
                      }));
                    }
                  } else if (event.type === 'done') {
                    const finalMsg = event.message || {
                      _id: `msg-${Date.now()}`,
                      role: 'assistant',
                      content: accumulatedText,
                      createdAt: new Date().toISOString(),
                    };

                    set((s) => ({
                      messages: [...s.messages, finalMsg],
                      isStreaming: false,
                      streamingText: '',
                      abortController: null,
                    }));
                  } else if (event.error) {
                    throw new Error(event.error);
                  }
                } catch (jsonErr) {
                  console.warn('[ChatStore] SSE parse warning:', jsonErr.message);
                }
              }
            }
          }
        } catch (err) {
          if (err.name === 'AbortError') {
            return;
          }
          set({
            error: err.message || 'Failed to generate response',
            isStreaming: false,
            streamingText: '',
            abortController: null,
          });
        }
      },
    }),
    { name: 'chat-store' }
  )
);

export default useChatStore;
