import { create } from 'zustand';
import { interviewApi } from '@/lib/api/interview.api.js';
import { streamInterviewResponse, sanitizeErrorMessage } from '@/lib/sse.js';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';

export const useInterviewStore = create((set, get) => ({
  // Past sessions history
  sessions: [],
  isLoadingSessions: false,

  // Setup form fields
  role: 'Full-Stack Engineer',
  difficulty: 'mid',
  topic: 'MERN Stack Architecture & REST/WebSocket APIs',
  selectedModel: 'flash',

  // Active session
  currentSession: null,
  messages: [],
  scorecard: null,
  archivedLibraryItem: null,

  // Loading & streaming indicators
  isStarting: false,
  isStreaming: false,
  isConcluding: false,
  abortController: null,
  error: null,
  insufficientCredits: false,

  // Audio & Speech states
  isListening: false,
  isSpeaking: false,
  speakingSource: null, // 'candidate' | 'interviewer' | null
  isTtsEnabled: true,
  transcriptOpen: false,

  // Setup action
  setSetupField: (field, value) => {
    set({ [field]: value });
  },

  // Audio state actions
  setIsListening: (isListening) => {
    set((state) => ({
      isListening,
      isSpeaking: isListening ? true : state.speakingSource === 'interviewer' ? true : false,
      speakingSource: isListening ? 'candidate' : state.speakingSource === 'candidate' ? null : state.speakingSource,
    }));
  },

  setIsSpeaking: (isSpeaking, source = null) => {
    set({ isSpeaking, speakingSource: source });
  },

  toggleTts: () => {
    set((state) => {
      const next = !state.isTtsEnabled;
      if (!next && typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      return { isTtsEnabled: next };
    });
  },

  toggleTranscript: () => {
    set((state) => ({ transcriptOpen: !state.transcriptOpen }));
  },

  // Fetch list of interviews
  fetchSessions: async () => {
    set({ isLoadingSessions: true });
    try {
      const res = await interviewApi.getInterviews();
      const sessions = res.data?.interviews || [];
      set({ sessions, isLoadingSessions: false });
    } catch {
      set({ isLoadingSessions: false });
      toast.error('Failed to load past interview sessions');
    }
  },

  // Load an existing session
  loadSession: async (id) => {
    set({ isStarting: true, error: null });
    try {
      const res = await interviewApi.getInterviewById(id);
      const session = res.data?.interview;
      if (!session) throw new Error('Session not found');

      set({
        currentSession: session,
        messages: session.messages || [],
        scorecard: session.scorecard || null,
        role: session.role,
        difficulty: session.difficulty,
        topic: session.topic,
        isStarting: false,
      });
    } catch (err) {
      set({ isStarting: false, error: err.message });
      toast.error('Failed to load interview session');
    }
  },

  // Start new interview
  startInterview: async (config = {}) => {
    const role = config.role || get().role;
    const difficulty = config.difficulty || get().difficulty;
    const topic = config.topic || get().topic;
    const model = config.model || get().selectedModel;

    set({
      isStarting: true,
      error: null,
      insufficientCredits: false,
      scorecard: null,
      archivedLibraryItem: null,
    });

    try {
      const res = await interviewApi.startInterview({
        role,
        difficulty,
        topic,
        model,
      });

      const { session, creditsRemaining } = res.data;

      if (typeof creditsRemaining === 'number') {
        useAuthStore.getState().updateCredits(creditsRemaining);
      }

      set({
        currentSession: session,
        messages: session.messages || [],
        isStarting: false,
      });

      // Speak initial interviewer greeting if TTS is enabled
      const firstMsg = session.messages?.[0]?.content;
      if (firstMsg && get().isTtsEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        get().speakInterviewerText(firstMsg);
      }

      toast.success('Interview started! Answer with voice or text.');
    } catch (err) {
      const is402 = err.response?.status === 402 || err.code === 'INSUFFICIENT_CREDITS';
      const cleanMessage = sanitizeErrorMessage(
        err.response?.data?.error?.message || err.message || 'Failed to start interview',
      );

      set({
        isStarting: false,
        error: cleanMessage,
        insufficientCredits: is402,
      });

      if (is402) {
        toast.error('Insufficient credits. Please recharge your wallet.');
      } else {
        toast.error(cleanMessage);
      }
    }
  },

  // Send candidate answer and stream interviewer response
  sendResponse: async (content) => {
    const trimmed = (content || '').trim();
    const session = get().currentSession;

    if (!trimmed || !session || get().isStreaming) return;

    const userMessage = {
      role: 'user',
      content: trimmed,
      tokensUsed: 0,
      timestamp: new Date().toISOString(),
    };

    const assistantPlaceholder = {
      role: 'assistant',
      content: '',
      tokensUsed: 0,
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };

    const abortController = new AbortController();

    set((state) => ({
      messages: [...state.messages, userMessage, assistantPlaceholder],
      isStreaming: true,
      abortController,
      error: null,
      isSpeaking: true,
      speakingSource: 'interviewer',
    }));

    try {
      const model = get().selectedModel;

      await streamInterviewResponse({
        interviewId: session._id,
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
                content: lastMsg.content + text,
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
                tokensUsed: doneData.tokensUsed || lastMsg.tokensUsed,
                isStreaming: false,
              };
            }
            return {
              messages: msgs,
              isStreaming: false,
              abortController: null,
              isSpeaking: false,
              speakingSource: null,
            };
          });

          // Sync credit balance reactively
          if (typeof doneData.creditsRemaining === 'number') {
            useAuthStore.getState().updateCredits(doneData.creditsRemaining);
          }

          // Trigger speech readout of completed response
          const msgs = get().messages;
          const completedText = msgs[msgs.length - 1]?.content;
          if (completedText && get().isTtsEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
            get().speakInterviewerText(completedText);
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
              isSpeaking: false,
              speakingSource: null,
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
        const cleanMessage = sanitizeErrorMessage(err.message || 'Failed to send response');

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
            isSpeaking: false,
            speakingSource: null,
          };
        });

        if (!is402) {
          toast.error(cleanMessage);
        }
      }
    }
  },

  // Stop active generation
  stopStreaming: () => {
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
          isSpeaking: false,
          speakingSource: null,
        };
      });
    }
  },

  // Conclude session, generate evaluation scorecard, and auto-archive
  concludeInterview: async () => {
    const session = get().currentSession;
    if (!session) return;

    // Cancel active TTS if playing
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    set({ isConcluding: true, error: null });

    try {
      const model = get().selectedModel;
      const res = await interviewApi.concludeInterview(session._id, { model });
      const { session: updatedSession, libraryItem, creditsRemaining } = res.data;

      if (typeof creditsRemaining === 'number') {
        useAuthStore.getState().updateCredits(creditsRemaining);
      }

      set({
        currentSession: updatedSession,
        scorecard: updatedSession.scorecard,
        archivedLibraryItem: libraryItem,
        isConcluding: false,
      });

      toast.success('Interview concluded! Scorecard generated & saved to Library.');
      get().fetchSessions();
    } catch (err) {
      const is402 = err.response?.status === 402 || err.code === 'INSUFFICIENT_CREDITS';
      const cleanMessage = sanitizeErrorMessage(
        err.response?.data?.error?.message || err.message || 'Failed to conclude interview',
      );

      set({
        isConcluding: false,
        error: cleanMessage,
        insufficientCredits: is402,
      });

      if (is402) {
        toast.error('Insufficient credits to generate evaluation report.');
      } else {
        toast.error(cleanMessage);
      }
    }
  },

  // Text-To-Speech audio readout helper
  speakInterviewerText: (text) => {
    if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        set({ isSpeaking: true, speakingSource: 'interviewer' });
      };

      utterance.onend = () => {
        set((state) => ({
          isSpeaking: state.isListening ? true : false,
          speakingSource: state.isListening ? 'candidate' : null,
        }));
      };

      utterance.onerror = () => {
        set((state) => ({
          isSpeaking: state.isListening ? true : false,
          speakingSource: state.isListening ? 'candidate' : null,
        }));
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis unsupported or failed silently
    }
  },

  // Reset to setup screen
  resetSession: () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    set({
      currentSession: null,
      messages: [],
      scorecard: null,
      archivedLibraryItem: null,
      error: null,
      isStreaming: false,
      isStarting: false,
      isConcluding: false,
    });
  },
}));
