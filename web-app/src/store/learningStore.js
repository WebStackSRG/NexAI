import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import apiClient from '../lib/apiClient';

const useLearningStore = create(
  devtools(
    (set, get) => ({
      activeTab: 'flashcards', // 'flashcards' | 'youtube' | 'pomodoro'
      flashcards: [],
      dueFlashcards: [],
      selectedTopic: 'all',
      isLoading: false,
      error: null,

      // Active Review Session State
      currentCardIndex: 0,
      isFlipped: false,
      reviewCompleted: false,

      // AI Generation State
      isGenerating: false,

      // YouTube State
      youtubeUrl: '',
      isSummarizing: false,
      youtubeSummary: null,

      // Pomodoro Focus Timer State
      focusTimeLeft: 25 * 60, // 25 min default
      timerRunning: false,
      timerMode: 'work', // 'work' | 'shortBreak' | 'longBreak'

      setActiveTab: (activeTab) => set({ activeTab }),
      setSelectedTopic: (selectedTopic) => set({ selectedTopic, currentCardIndex: 0, isFlipped: false, reviewCompleted: false }),
      setYoutubeUrl: (youtubeUrl) => set({ youtubeUrl }),
      setIsFlipped: (isFlipped) => set({ isFlipped }),
      flipCard: () => set((state) => ({ isFlipped: !state.isFlipped })),

      fetchFlashcards: async () => {
        set({ isLoading: true, error: null });
        try {
          const { selectedTopic } = get();
          const params = {};
          if (selectedTopic && selectedTopic !== 'all') {
            params.topic = selectedTopic;
          }
          const res = await apiClient.get('/flashcards', { params });
          const flashcards = res.data.flashcards || [];
          const now = new Date();
          const dueFlashcards = flashcards.filter(
            (c) => !c.nextReviewAt || new Date(c.nextReviewAt) <= now
          );

          set({
            flashcards,
            dueFlashcards: dueFlashcards.length > 0 ? dueFlashcards : flashcards,
            currentCardIndex: 0,
            isFlipped: false,
            reviewCompleted: false,
            isLoading: false,
          });
        } catch (err) {
          set({
            error: err.response?.data?.error || err.message || 'Failed to load flashcards',
            isLoading: false,
          });
        }
      },

      reviewCard: async (cardId, grade) => {
        try {
          const res = await apiClient.patch(/flashcards//review, { grade });
          const updatedCard = res.data.flashcard;

          set((state) => {
            const nextIdx = state.currentCardIndex + 1;
            const isDone = nextIdx >= state.dueFlashcards.length;
            return {
              flashcards: state.flashcards.map((c) =>
                (c._id || c.id) === cardId ? updatedCard : c
              ),
              dueFlashcards: state.dueFlashcards.map((c) =>
                (c._id || c.id) === cardId ? updatedCard : c
              ),
              currentCardIndex: isDone ? 0 : nextIdx,
              isFlipped: false,
              reviewCompleted: isDone,
            };
          });
        } catch (err) {
          set({ error: err.response?.data?.error || err.message || 'Review failed' });
        }
      },

      generateDeck: async ({ topic, count = 5, content = '' }) => {
        set({ isGenerating: true, error: null });
        try {
          const res = await apiClient.post('/flashcards/generate', {
            topic,
            count: Number(count),
            content,
          });
          const newCards = res.data.flashcards || [];
          set((state) => ({
            flashcards: [...newCards, ...state.flashcards],
            dueFlashcards: [...newCards, ...state.dueFlashcards],
            isGenerating: false,
            selectedTopic: topic,
            currentCardIndex: 0,
            isFlipped: false,
            reviewCompleted: false,
          }));
          return true;
        } catch (err) {
          set({
            error: err.response?.data?.error || err.message || 'Deck generation failed',
            isGenerating: false,
          });
          return false;
        }
      },

      createFlashcard: async ({ question, answer, topic }) => {
        try {
          const res = await apiClient.post('/flashcards', { question, answer, topic });
          const card = res.data.flashcard;
          set((state) => ({
            flashcards: [card, ...state.flashcards],
            dueFlashcards: [card, ...state.dueFlashcards],
          }));
          return true;
        } catch (err) {
          set({ error: err.response?.data?.error || err.message || 'Failed to create card' });
          return false;
        }
      },

      deleteFlashcard: async (cardId) => {
        try {
          await apiClient.delete(/flashcards/);
          set((state) => ({
            flashcards: state.flashcards.filter((c) => (c._id || c.id) !== cardId),
            dueFlashcards: state.dueFlashcards.filter((c) => (c._id || c.id) !== cardId),
          }));
        } catch (err) {
          set({ error: err.response?.data?.error || err.message || 'Delete failed' });
        }
      },

      summarizeYouTube: async (url) => {
        set({ isSummarizing: true, error: null, youtubeSummary: null });
        try {
          const res = await apiClient.post('/learning/youtube-summary', { url });
          set({
            youtubeSummary: res.data.summary,
            isSummarizing: false,
          });
        } catch (err) {
          set({
            error: err.response?.data?.error || err.message || 'YouTube summarization failed',
            isSummarizing: false,
          });
        }
      },

      // Pomodoro Controls
      setTimerMode: (mode) => {
        let seconds = 25 * 60;
        if (mode === 'shortBreak') seconds = 5 * 60;
        if (mode === 'longBreak') seconds = 15 * 60;
        set({ timerMode: mode, focusTimeLeft: seconds, timerRunning: false });
      },
      setTimerRunning: (timerRunning) => set({ timerRunning }),
      tickTimer: () =>
        set((state) => {
          if (state.focusTimeLeft <= 1) {
            return { focusTimeLeft: 0, timerRunning: false };
          }
          return { focusTimeLeft: state.focusTimeLeft - 1 };
        }),
      resetTimer: () => {
        const { timerMode } = get();
        let seconds = 25 * 60;
        if (timerMode === 'shortBreak') seconds = 5 * 60;
        if (timerMode === 'longBreak') seconds = 15 * 60;
        set({ focusTimeLeft: seconds, timerRunning: false });
      },
    }),
    { name: 'LearningStore' }
  )
);

export default useLearningStore;
