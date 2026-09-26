import { describe, it, expect, beforeEach } from 'vitest';
import { useInterviewStore } from './interviewStore';

describe('useInterviewStore', () => {
  beforeEach(() => {
    useInterviewStore.getState().resetSession();
    useInterviewStore.setState({
      role: 'Full-Stack Engineer',
      difficulty: 'mid',
      topic: 'MERN Stack Architecture & REST/WebSocket APIs',
      selectedModel: 'flash',
      isTtsEnabled: true,
      isListening: false,
      isSpeaking: false,
      speakingSource: null,
    });
  });

  it('initializes with default setup fields', () => {
    const state = useInterviewStore.getState();
    expect(state.role).toBe('Full-Stack Engineer');
    expect(state.difficulty).toBe('mid');
    expect(state.selectedModel).toBe('flash');
    expect(state.currentSession).toBeNull();
    expect(state.scorecard).toBeNull();
  });

  it('updates setup fields with setSetupField', () => {
    useInterviewStore.getState().setSetupField('role', 'MSBTE Capstone Viva');
    useInterviewStore.getState().setSetupField('difficulty', 'senior');
    useInterviewStore.getState().setSetupField('topic', 'AI Assistant Architecture');

    const state = useInterviewStore.getState();
    expect(state.role).toBe('MSBTE Capstone Viva');
    expect(state.difficulty).toBe('senior');
    expect(state.topic).toBe('AI Assistant Architecture');
  });

  it('toggles TTS setting', () => {
    expect(useInterviewStore.getState().isTtsEnabled).toBe(true);
    useInterviewStore.getState().toggleTts();
    expect(useInterviewStore.getState().isTtsEnabled).toBe(false);
    useInterviewStore.getState().toggleTts();
    expect(useInterviewStore.getState().isTtsEnabled).toBe(true);
  });

  it('updates speech and listening states', () => {
    useInterviewStore.getState().setIsListening(true);
    expect(useInterviewStore.getState().isListening).toBe(true);
    expect(useInterviewStore.getState().speakingSource).toBe('candidate');

    useInterviewStore.getState().setIsListening(false);
    expect(useInterviewStore.getState().isListening).toBe(false);
    expect(useInterviewStore.getState().speakingSource).toBeNull();

    useInterviewStore.getState().setIsSpeaking(true, 'interviewer');
    expect(useInterviewStore.getState().isSpeaking).toBe(true);
    expect(useInterviewStore.getState().speakingSource).toBe('interviewer');
  });

  it('resets session properly with resetSession', () => {
    useInterviewStore.setState({
      currentSession: { _id: '123' },
      messages: [{ role: 'user', content: 'test' }],
      scorecard: { overallScore: 90 },
      isStreaming: true,
    });

    useInterviewStore.getState().resetSession();
    const state = useInterviewStore.getState();
    expect(state.currentSession).toBeNull();
    expect(state.messages).toEqual([]);
    expect(state.scorecard).toBeNull();
    expect(state.isStreaming).toBe(false);
  });
});
