import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import apiClient from '../lib/apiClient';

const useFocusStore = create(
  devtools(
    (set, get) => ({
      reminders: [],
      sessions: [],
      quietHours: { enabled: false, start: '22:00', end: '08:00' },
      isLoading: false,
      error: null,

      fetchReminders: async () => {
        try {
          const res = await apiClient.get('/focus/reminders');
          set({ reminders: res.data.reminders || [] });
        } catch (err) {
          set({ error: err.response?.data?.error || err.message || 'Failed to fetch reminders' });
        }
      },

      createReminder: async ({ title, remindAt, itemType = 'custom' }) => {
        try {
          const res = await apiClient.post('/focus/reminders', { title, remindAt, itemType });
          const reminder = res.data.reminder;
          set((state) => ({ reminders: [...state.reminders, reminder] }));
          return true;
        } catch (err) {
          set({ error: err.response?.data?.error || err.message || 'Failed to create reminder' });
          return false;
        }
      },

      toggleReminderComplete: async (id, isCompleted) => {
        try {
          const res = await apiClient.patch(`/focus/reminders/${id}`, { isCompleted });
          const updated = res.data.reminder;
          set((state) => ({
            reminders: state.reminders.map((r) => ((r._id || r.id) === id ? updated : r)),
          }));
        } catch (err) {
          set({ error: err.response?.data?.error || err.message || 'Failed to update reminder' });
        }
      },

      deleteReminder: async (id) => {
        try {
          await apiClient.delete(`/focus/reminders/${id}`);
          set((state) => ({
            reminders: state.reminders.filter((r) => (r._id || r.id) !== id),
          }));
        } catch (err) {
          set({ error: err.response?.data?.error || err.message || 'Failed to delete reminder' });
        }
      },

      fetchSessions: async () => {
        try {
          const res = await apiClient.get('/focus/sessions');
          set({ sessions: res.data.sessions || [] });
        } catch (err) {
          set({ error: err.response?.data?.error || err.message || 'Failed to fetch sessions' });
        }
      },

      createSession: async ({ name, description, links }) => {
        try {
          const res = await apiClient.post('/focus/sessions', { name, description, links });
          const session = res.data.session;
          set((state) => ({ sessions: [session, ...state.sessions] }));
          return true;
        } catch (err) {
          set({ error: err.response?.data?.error || err.message || 'Failed to create session' });
          return false;
        }
      },

      deleteSession: async (id) => {
        try {
          await apiClient.delete(`/focus/sessions/${id}`);
          set((state) => ({
            sessions: state.sessions.filter((s) => (s._id || s.id) !== id),
          }));
        } catch (err) {
          set({ error: err.response?.data?.error || err.message || 'Failed to delete session' });
        }
      },

      updateQuietHours: async ({ enabled, start, end }) => {
        try {
          const res = await apiClient.patch('/focus/quiet-hours', { enabled, start, end });
          set({ quietHours: res.data.quietHours });
          return true;
        } catch (err) {
          set({ error: err.response?.data?.error || err.message || 'Failed to update quiet hours' });
          return false;
        }
      },
    }),
    { name: 'focus-store' }
  )
);

export default useFocusStore;
