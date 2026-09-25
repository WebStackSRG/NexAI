import { create } from 'zustand';
import { chatApi } from '@/lib/api/chat.api.js';
import { streamChatMessage, sanitizeErrorMessage } from '@/lib/sse.js';
import { useAuthStore } from './authStore.js';
import { toast } from './uiStore.js';

export const useChatStore = create((set, get) => ({
  chats: [],
  activeChatId: null,
  messages: [],
  isLoadingChats: false,
  isLoadingMessages: false,
  isStreaming: false,
  abortController: null,
  error: null,
  insufficientCredits: false,
  selectedModel: 'flash',

  /**
   * Set the AI model to use (flash or pro)
   * @param {'flash' | 'pro'} model
   */
  setSelectedModel: (model) => set({ selectedModel: model }),

  /**
   * Fetch all user chat sessions
   */
  fetchChats: async () => {
    set({ isLoadingChats: true, error: null });
    try {
      const response = await chatApi.getChats();
      const chats = response.data || [];
      set({ chats, isLoadingChats: false });
      return chats;
    } catch (err) {
      const message = err.message || 'Failed to load chats';
      set({ isLoadingChats: false, error: message });
      toast.error(message);
      return [];
    }
  },

  /**
   * Create a new chat session
   * @param {string} [title]
   */
  createChat: async (title = 'New Chat') => {
    try {
      const response = await chatApi.createChat(title);
      const newChat = response.data;
      set((state) => ({
        chats: [newChat, ...state.chats],
        activeChatId: newChat._id,
        messages: [],
        error: null,
        insufficientCredits: false,
      }));
      return newChat;
    } catch (err) {
      const message = err.message || 'Failed to create chat';
      set({ error: message });
      toast.error(message);
      return null;
    }
  },

  /**
   * Select a chat and load its messages
   * @param {string} chatId
   */
  selectChat: async (chatId) => {
    if (get().activeChatId === chatId) {
      return;
    }

    // Abort active stream if user switches chat
    if (get().isStreaming && get().abortController) {
      get().abortController.abort();
    }

    set({
      activeChatId: chatId,
      messages: [],
      isStreaming: false,
      abortController: null,
      error: null,
    });

    if (chatId) {
      await get().fetchMessages(chatId);
    }
  },

  /**
   * Update chat title
   * @param {string} chatId
   * @param {string} title
   */
  updateChatTitle: async (chatId, title) => {
    try {
      const response = await chatApi.updateChat(chatId, title);
      const updatedChat = response.data;
      set((state) => ({
        chats: state.chats.map((c) => (c._id === chatId ? updatedChat : c)),
      }));
      return updatedChat;
    } catch (err) {
      const message = err.message || 'Failed to rename chat';
      toast.error(message);
      return null;
    }
  },

  /**
   * Delete a chat and its messages
   * @param {string} chatId
   */
  deleteChat: async (chatId) => {
    try {
      await chatApi.deleteChat(chatId);
      set((state) => {
        const remainingChats = state.chats.filter((c) => c._id !== chatId);
        const nextActiveId =
          state.activeChatId === chatId
            ? remainingChats.length > 0
              ? remainingChats[0]._id
              : null
            : state.activeChatId;

        return {
          chats: remainingChats,
          activeChatId: nextActiveId,
          messages: state.activeChatId === chatId ? [] : state.messages,
        };
      });

      // Load messages for the next active chat if switched
      const currentActiveId = get().activeChatId;
      if (currentActiveId) {
        get().fetchMessages(currentActiveId);
      }
      return true;
    } catch (err) {
      const message = err.message || 'Failed to delete chat';
      toast.error(message);
      return false;
    }
  },

  /**
   * Fetch messages for a specific chat
   * @param {string} chatId
   */
  fetchMessages: async (chatId) => {
    set({ isLoadingMessages: true, error: null });
    try {
      const response = await chatApi.getMessages(chatId);
      const messages = response.data || [];
      // Only set messages if the user hasn't switched to another chat while fetching
      if (get().activeChatId === chatId) {
        set({ messages, isLoadingMessages: false });
      }
      return messages;
    } catch (err) {
      const message = err.message || 'Failed to load messages';
      set({ isLoadingMessages: false, error: message });
      toast.error(message);
      return [];
    }
  },

  /**
   * Send a message and stream the assistant response
   * @param {string} content
   */
  sendMessage: async (content) => {
    const trimmed = content.trim();
    if (!trimmed || get().isStreaming) {
      return;
    }

    if (get().insufficientCredits) {
      toast.error('Insufficient credits. Recharge to continue.');
      return;
    }

    let targetChatId = get().activeChatId;

    // Auto-create chat session if none is selected
    if (!targetChatId) {
      const newChat = await get().createChat('New Chat');
      if (!newChat) {
        return;
      }
      targetChatId = newChat._id;
    }

    const optimisticUserId = `temp-user-${Date.now()}`;
    const optimisticAssistantId = `temp-assistant-${Date.now()}`;

    const userMessage = {
      _id: optimisticUserId,
      chatId: targetChatId,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    const assistantMessage = {
      _id: optimisticAssistantId,
      chatId: targetChatId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      createdAt: new Date().toISOString(),
    };

    const abortController = new AbortController();

    set((state) => ({
      messages: [...state.messages, userMessage, assistantMessage],
      isStreaming: true,
      abortController,
      error: null,
    }));

    try {
      const model = get().selectedModel;

      await streamChatMessage({
        chatId: targetChatId,
        content: trimmed,
        model,
        signal: abortController.signal,
        onToken: (text) => {
          set((state) => {
            const msgs = [...state.messages];
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
              msgs[msgs.length - 1] = {
                ...lastMsg,
                content: (lastMsg.content || '') + text,
              };
            }
            return { messages: msgs };
          });
        },
        onDone: (doneData) => {
          set((state) => {
            const msgs = [...state.messages];
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
              msgs[msgs.length - 1] = {
                ...lastMsg,
                _id: doneData.messageId || lastMsg._id,
                tokensUsed: doneData.tokensUsed,
                isStreaming: false,
              };
            }

            let updatedChats = state.chats;
            if (doneData.chatTitle) {
              updatedChats = state.chats.map((c) =>
                c._id === targetChatId
                  ? { ...c, title: doneData.chatTitle, updatedAt: new Date().toISOString() }
                  : c,
              );
            }

            return {
              messages: msgs,
              chats: updatedChats,
              isStreaming: false,
              abortController: null,
            };
          });

          // Sync credit balance reactively to authStore
          if (typeof doneData.creditsRemaining === 'number') {
            useAuthStore.getState().updateCredits(doneData.creditsRemaining);
          }
        },
        onError: (err) => {
          const is402 = err.status === 402 || err.code === 'INSUFFICIENT_CREDITS';
          const cleanMessage = sanitizeErrorMessage(err.message || 'Stream error occurred');

          set((state) => {
            const msgs = [...state.messages];
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
              msgs[msgs.length - 1] = {
                ...lastMsg,
                isStreaming: false,
                error: cleanMessage,
              };
            }

            return {
              messages: msgs,
              isStreaming: false,
              abortController: null,
              insufficientCredits: is402 ? true : state.insufficientCredits,
              error: cleanMessage,
            };
          });

          if (is402) {
            toast.error('Insufficient credits. Recharge to continue.');
          } else if (err.name !== 'AbortError') {
            toast.error(cleanMessage);
          }
        },
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        const is402 = err.status === 402 || err.code === 'INSUFFICIENT_CREDITS';
        const cleanMessage = sanitizeErrorMessage(err.message || 'Failed to send message');

        set((state) => {
          const msgs = [...state.messages];
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            msgs[msgs.length - 1] = { ...lastMsg, isStreaming: false };
          }
          return {
            messages: msgs,
            isStreaming: false,
            abortController: null,
            insufficientCredits: is402 ? true : state.insufficientCredits,
            error: cleanMessage,
          };
        });

        if (!is402) {
          toast.error(cleanMessage);
        }
      }
    }
  },

  /**
   * Abort the active response generation
   */
  stopGeneration: () => {
    const { abortController, isStreaming } = get();
    if (isStreaming && abortController) {
      abortController.abort();
      set((state) => {
        const msgs = [...state.messages];
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          msgs[msgs.length - 1] = { ...lastMsg, isStreaming: false };
        }
        return {
          messages: msgs,
          isStreaming: false,
          abortController: null,
        };
      });
    }
  },

  /**
   * Resend a prompt, cleaning up an errored assistant message if one is currently at the end
   * @param {string} content
   */
  resendPrompt: async (content) => {
    set((state) => {
      const msgs = [...state.messages];
      if (msgs.length > 0 && msgs[msgs.length - 1].error) {
        msgs.pop();
      }
      return { messages: msgs };
    });
    await get().sendMessage(content);
  },

  /**
   * Reset the insufficient credits state
   */
  resetInsufficientCredits: () => set({ insufficientCredits: false }),

  /**
   * Clear error state
   */
  clearError: () => set({ error: null }),
}));
