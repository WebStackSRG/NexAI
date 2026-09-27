import { describe, it, expect, beforeEach } from 'vitest';
import { useUiStore } from './uiStore';

describe('uiStore Zustand Store', () => {
  beforeEach(() => {
    localStorage.clear();
    useUiStore.setState({
      theme: 'dark',
      isDrawerOpen: false,
      isSidebarCollapsed: false,
      toasts: [],
    });
  });

  it('initializes with default sidebar not collapsed', () => {
    expect(useUiStore.getState().isSidebarCollapsed).toBe(false);
  });

  it('toggles sidebar collapsed state and persists in localStorage', () => {
    useUiStore.getState().toggleSidebarCollapsed();
    expect(useUiStore.getState().isSidebarCollapsed).toBe(true);
    expect(localStorage.getItem('nexai_sidebar_collapsed')).toBe('true');

    useUiStore.getState().toggleSidebarCollapsed();
    expect(useUiStore.getState().isSidebarCollapsed).toBe(false);
    expect(localStorage.getItem('nexai_sidebar_collapsed')).toBe('false');
  });

  it('sets sidebar collapsed state explicitly', () => {
    useUiStore.getState().setSidebarCollapsed(true);
    expect(useUiStore.getState().isSidebarCollapsed).toBe(true);
    expect(localStorage.getItem('nexai_sidebar_collapsed')).toBe('true');

    useUiStore.getState().setSidebarCollapsed(false);
    expect(useUiStore.getState().isSidebarCollapsed).toBe(false);
    expect(localStorage.getItem('nexai_sidebar_collapsed')).toBe('false');
  });
});
