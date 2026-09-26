import { create } from 'zustand';
import { projectApi } from '@/lib/api/project.api.js';
import { toast } from './uiStore.js';

export const DEFAULT_PROJECTS = [
  { _id: 'p1', name: 'JS & WebStack', color: '#8b5cf6', chatCount: 0 },
  { _id: 'p2', name: 'AI Viva Preparation', color: '#3b82f6', chatCount: 0 },
  { _id: 'p3', name: 'System Architecture', color: '#10b981', chatCount: 0 },
];

export const useProjectStore = create((set) => ({
  projects: DEFAULT_PROJECTS,
  currentProject: null,
  isLoading: false,
  isSaving: false,
  error: null,

  /**
   * Fetch all user projects with chat counts
   */
  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await projectApi.getProjects();
      const projects = response.data || [];
      set({ projects, isLoading: false });
      return projects;
    } catch (err) {
      const message = err.message || 'Failed to load projects';
      set({ isLoading: false, error: message });
      toast.error(message);
      return [];
    }
  },

  /**
   * Fetch a single project workspace with its chats
   * @param {string} id
   */
  fetchProject: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await projectApi.getProject(id);
      const project = response.data || null;
      set({ currentProject: project, isLoading: false });
      return project;
    } catch (err) {
      const message = err.message || 'Failed to load project details';
      set({ isLoading: false, error: message });
      toast.error(message);
      return null;
    }
  },

  /**
   * Create a new project workspace
   * @param {{ name: string, description?: string, customInstructions?: string, color?: string }} data
   */
  createProject: async (data) => {
    set({ isSaving: true });
    try {
      const response = await projectApi.createProject(data);
      const newProject = response.data;
      set((state) => ({
        projects: [newProject, ...state.projects],
        isSaving: false,
      }));
      toast.success(`Project "${newProject.name}" created`);
      return newProject;
    } catch (err) {
      const message = err.message || 'Failed to create project';
      set({ isSaving: false });
      toast.error(message);
      return null;
    }
  },

  /**
   * Update an existing project workspace
   * @param {string} id
   * @param {{ name?: string, description?: string, customInstructions?: string, color?: string }} data
   */
  updateProject: async (id, data) => {
    set({ isSaving: true });
    try {
      const response = await projectApi.updateProject(id, data);
      const updated = response.data;
      set((state) => ({
        projects: state.projects.map((p) => (p._id === id ? { ...p, ...updated } : p)),
        currentProject:
          state.currentProject?._id === id
            ? { ...state.currentProject, ...updated }
            : state.currentProject,
        isSaving: false,
      }));
      toast.success('Project updated');
      return updated;
    } catch (err) {
      const message = err.message || 'Failed to update project';
      set({ isSaving: false });
      toast.error(message);
      return null;
    }
  },

  /**
   * Delete a project workspace and unlink chats
   * @param {string} id
   */
  deleteProject: async (id) => {
    try {
      await projectApi.deleteProject(id);
      set((state) => ({
        projects: state.projects.filter((p) => p._id !== id),
        currentProject: state.currentProject?._id === id ? null : state.currentProject,
      }));
      toast.success('Project deleted');
      return true;
    } catch (err) {
      const message = err.message || 'Failed to delete project';
      toast.error(message);
      return false;
    }
  },

  /**
   * Set current active project manually
   */
  setCurrentProject: (project) => set({ currentProject: project }),

  /**
   * Add a source to the project workspace
   * @param {string} projectId
   * @param {{ name: string, originalName?: string, mimeType?: string, size?: number, content?: string }} sourceData
   */
  addSource: async (projectId, sourceData) => {
    try {
      const response = await projectApi.addSource(projectId, sourceData);
      const newSource = response.data;
      set((state) => {
        if (!state.currentProject || state.currentProject._id !== projectId) {
          return state;
        }
        const updatedSources = [...(state.currentProject.sources || []), newSource];
        return {
          currentProject: {
            ...state.currentProject,
            sources: updatedSources,
          },
        };
      });
      toast.success(`Source "${newSource.name}" added`);
      return newSource;
    } catch (err) {
      const message = err.message || 'Failed to add source';
      toast.error(message);
      return null;
    }
  },

  /**
   * Delete a source from the project workspace
   * @param {string} projectId
   * @param {string} sourceId
   */
  deleteSource: async (projectId, sourceId) => {
    try {
      await projectApi.deleteSource(projectId, sourceId);
      set((state) => {
        if (!state.currentProject || state.currentProject._id !== projectId) {
          return state;
        }
        const updatedSources = (state.currentProject.sources || []).filter(
          (s) => s._id !== sourceId,
        );
        return {
          currentProject: {
            ...state.currentProject,
            sources: updatedSources,
          },
        };
      });
      toast.success('Source deleted');
      return true;
    } catch (err) {
      const message = err.message || 'Failed to delete source';
      toast.error(message);
      return false;
    }
  },
}));
