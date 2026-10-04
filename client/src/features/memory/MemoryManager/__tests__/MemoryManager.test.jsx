import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryManager } from '../MemoryManager';
import { useMemoryStore } from '@/store/memoryStore';
import { useAuthStore } from '@/store/authStore';

vi.mock('@/store/memoryStore');
vi.mock('@/store/authStore');
vi.mock('@/components/ui/Toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('MemoryManager Component', () => {
  const mockUpdateSettings = vi.fn().mockResolvedValue({ success: true });
  const mockFetchMemories = vi.fn();
  const mockAddMemory = vi.fn().mockResolvedValue({ _id: '3', fact: 'New fact' });
  const mockUpdateMemory = vi.fn().mockResolvedValue({ _id: '1', fact: 'Updated fact' });
  const mockDeleteMemory = vi.fn().mockResolvedValue(true);
  const mockTogglePin = vi.fn().mockResolvedValue(true);
  const mockClearAll = vi.fn().mockResolvedValue(true);
  const mockConsolidateMemories = vi.fn().mockResolvedValue({ memories: [] });

  const mockMemories = [
    {
      _id: '1',
      fact: "User's name is Rewan",
      category: 'identity',
      pinned: true,
    },
    {
      _id: '2',
      fact: 'Prefers TypeScript and React',
      category: 'preference',
      pinned: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    useAuthStore.mockReturnValue({
      user: {
        email: 'rewan@example.com',
        settings: {
          personalization: {
            customInstructions: 'Always answer in bullet points',
            responseTone: 'concise',
            aiMemoryEnabled: true,
          },
        },
      },
      updateSettings: mockUpdateSettings,
    });

    useMemoryStore.mockReturnValue({
      memories: mockMemories,
      isLoading: false,
      isSaving: false,
      isConsolidating: false,
      fetchMemories: mockFetchMemories,
      addMemory: mockAddMemory,
      updateMemory: mockUpdateMemory,
      deleteMemory: mockDeleteMemory,
      clearAll: mockClearAll,
      togglePin: mockTogglePin,
      consolidateMemories: mockConsolidateMemories,
    });
  });

  it('renders Personalization Directives and AI Memory Bank sections', () => {
    render(<MemoryManager />);

    expect(screen.getByText('Personalization Directives')).toBeInTheDocument();
    expect(screen.getByText('AI Memory Bank')).toBeInTheDocument();
    expect(screen.getByText("User's name is Rewan")).toBeInTheDocument();
    expect(screen.getByText('Prefers TypeScript and React')).toBeInTheDocument();
  });

  it('toggles Autonomous AI Memory Learning switch and updates settings', async () => {
    render(<MemoryManager />);

    const switchBtn = screen.getByRole('switch', { name: /toggle autonomous memory learning/i });
    expect(switchBtn).toBeInTheDocument();

    fireEvent.click(switchBtn);

    expect(mockUpdateSettings).toHaveBeenCalledWith({
      personalization: expect.objectContaining({
        aiMemoryEnabled: false,
      }),
    });
  });

  it('filters memories when a category pill is clicked', () => {
    render(<MemoryManager />);

    const identityPill = screen.getByRole('button', { name: 'Identity' });
    fireEvent.click(identityPill);

    expect(screen.getByText("User's name is Rewan")).toBeInTheDocument();
    expect(screen.queryByText('Prefers TypeScript and React')).not.toBeInTheDocument();
  });

  it('filters memories by keyword search', () => {
    render(<MemoryManager />);

    const searchInput = screen.getByPlaceholderText('Search memories by keyword...');
    fireEvent.change(searchInput, { target: { value: 'TypeScript' } });

    expect(screen.getByText('Prefers TypeScript and React')).toBeInTheDocument();
    expect(screen.queryByText("User's name is Rewan")).not.toBeInTheDocument();
  });

  it('triggers Consolidate with AI when button is clicked', async () => {
    render(<MemoryManager />);

    const consolidateBtn = screen.getByRole('button', { name: /consolidate with ai/i });
    expect(consolidateBtn).toBeInTheDocument();

    fireEvent.click(consolidateBtn);
    expect(mockConsolidateMemories).toHaveBeenCalled();
  });

  it('supports inline editing of a memory fact', async () => {
    render(<MemoryManager />);

    const editBtns = screen.getAllByTitle('Edit memory');
    fireEvent.click(editBtns[0]);

    const input = screen.getByDisplayValue("User's name is Rewan");
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "User's name is Alex" } });
    const saveBtn = screen.getByTitle('Save change');
    fireEvent.click(saveBtn);

    expect(mockUpdateMemory).toHaveBeenCalledWith('1', { fact: "User's name is Alex" });
  });
});
