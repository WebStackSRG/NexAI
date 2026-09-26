import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePromptStore } from './promptStore';
import { promptApi } from '@/lib/api/prompt.api';

vi.mock('@/lib/api/prompt.api', () => ({
  promptApi: {
    getPrompts: vi.fn(),
    getPrompt: vi.fn(),
    createPrompt: vi.fn(),
    updatePrompt: vi.fn(),
    deletePrompt: vi.fn(),
  },
}));

describe('promptStore Zustand Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePromptStore.setState({
      prompts: [],
      selectedPrompt: null,
      isLoading: false,
      isSaving: false,
      error: null,
      activeTag: null,
      searchQuery: '',
      favoriteOnly: false,
    });
  });

  it('fetchPrompts populates prompt list', async () => {
    const mockPrompts = [
      { _id: 'pr1', title: 'Code Reviewer', variables: ['code', 'language'] },
      { _id: 'pr2', title: 'Email Writer', variables: ['tone', 'recipient'] },
    ];
    promptApi.getPrompts.mockResolvedValueOnce({ data: mockPrompts });

    const result = await usePromptStore.getState().fetchPrompts();

    expect(result).toHaveLength(2);
    expect(usePromptStore.getState().prompts).toEqual(mockPrompts);
    expect(usePromptStore.getState().isLoading).toBe(false);
  });

  it('createPrompt adds new prompt to beginning of state list', async () => {
    const newPrompt = {
      _id: 'pr3',
      title: 'SQL Generator',
      template: 'Generate SQL for {{table}} with schema {{schema}}',
      variables: ['table', 'schema'],
      tags: ['database'],
      isFavorite: false,
    };
    promptApi.createPrompt.mockResolvedValueOnce({ data: newPrompt });

    const result = await usePromptStore.getState().createPrompt({
      title: 'SQL Generator',
      template: 'Generate SQL for {{table}} with schema {{schema}}',
    });

    expect(result).toEqual(newPrompt);
    expect(usePromptStore.getState().prompts[0]).toEqual(newPrompt);
  });

  it('updatePrompt updates prompt in list and selectedPrompt', async () => {
    const initial = { _id: 'pr1', title: 'Old Title', template: 'Old template' };
    usePromptStore.setState({
      prompts: [initial],
      selectedPrompt: initial,
    });

    const updated = { _id: 'pr1', title: 'New Title', template: 'Old template' };
    promptApi.updatePrompt.mockResolvedValueOnce({ data: updated });

    await usePromptStore.getState().updatePrompt('pr1', { title: 'New Title' });

    expect(usePromptStore.getState().prompts[0].title).toBe('New Title');
    expect(usePromptStore.getState().selectedPrompt.title).toBe('New Title');
  });

  it('toggleFavorite updates favorite state optimistically and syncs with API', async () => {
    const initial = { _id: 'pr1', title: 'Prompt 1', isFavorite: false };
    usePromptStore.setState({ prompts: [initial] });

    promptApi.updatePrompt.mockResolvedValueOnce({
      data: { ...initial, isFavorite: true },
    });

    await usePromptStore.getState().toggleFavorite('pr1');

    expect(usePromptStore.getState().prompts[0].isFavorite).toBe(true);
    expect(promptApi.updatePrompt).toHaveBeenCalledWith('pr1', { isFavorite: true });
  });

  it('deletePrompt removes prompt from state', async () => {
    usePromptStore.setState({
      prompts: [{ _id: 'pr1', title: 'To Delete' }],
      selectedPrompt: { _id: 'pr1', title: 'To Delete' },
    });
    promptApi.deletePrompt.mockResolvedValueOnce({ data: { id: 'pr1' } });

    const result = await usePromptStore.getState().deletePrompt('pr1');

    expect(result).toBe(true);
    expect(usePromptStore.getState().prompts).toHaveLength(0);
    expect(usePromptStore.getState().selectedPrompt).toBeNull();
  });
});
