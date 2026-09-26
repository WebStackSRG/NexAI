import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useProjectStore } from './projectStore';
import { projectApi } from '@/lib/api/project.api';

vi.mock('@/lib/api/project.api', () => ({
  projectApi: {
    getProjects: vi.fn(),
    getProject: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
  },
}));

describe('projectStore Zustand Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useProjectStore.setState({
      projects: [],
      currentProject: null,
      isLoading: false,
      isSaving: false,
      error: null,
    });
  });

  it('fetchProjects populates project list', async () => {
    const mockProjects = [
      { _id: 'p1', name: 'Web Dev', chatCount: 3 },
      { _id: 'p2', name: 'AI Architecture', chatCount: 1 },
    ];
    projectApi.getProjects.mockResolvedValueOnce({ data: mockProjects });

    const result = await useProjectStore.getState().fetchProjects();

    expect(result).toHaveLength(2);
    expect(useProjectStore.getState().projects).toEqual(mockProjects);
    expect(useProjectStore.getState().isLoading).toBe(false);
  });

  it('createProject adds new project to state', async () => {
    const newProj = {
      _id: 'p3',
      name: 'Python Project',
      customInstructions: 'Write clean code',
      chatCount: 0,
    };
    projectApi.createProject.mockResolvedValueOnce({ data: newProj });

    const result = await useProjectStore.getState().createProject({
      name: 'Python Project',
      customInstructions: 'Write clean code',
    });

    expect(result).toEqual(newProj);
    expect(useProjectStore.getState().projects[0]).toEqual(newProj);
  });

  it('updateProject modifies existing project in list and currentProject', async () => {
    const initial = { _id: 'p1', name: 'Old', customInstructions: 'Old' };
    useProjectStore.setState({
      projects: [initial],
      currentProject: initial,
    });

    const updated = { _id: 'p1', name: 'Updated', customInstructions: 'New' };
    projectApi.updateProject.mockResolvedValueOnce({ data: updated });

    await useProjectStore.getState().updateProject('p1', { name: 'Updated' });

    expect(useProjectStore.getState().projects[0].name).toBe('Updated');
    expect(useProjectStore.getState().currentProject.name).toBe('Updated');
  });

  it('deleteProject removes project from state', async () => {
    useProjectStore.setState({
      projects: [{ _id: 'p1', name: 'To Remove' }],
      currentProject: { _id: 'p1', name: 'To Remove' },
    });
    projectApi.deleteProject.mockResolvedValueOnce({ data: {} });

    await useProjectStore.getState().deleteProject('p1');

    expect(useProjectStore.getState().projects).toHaveLength(0);
    expect(useProjectStore.getState().currentProject).toBeNull();
  });
});
