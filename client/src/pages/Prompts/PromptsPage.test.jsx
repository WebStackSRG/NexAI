import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PromptsPage from './PromptsPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockFetchPrompts = vi.fn();
const mockCreatePrompt = vi.fn();
const mockUpdatePrompt = vi.fn();
const mockDeletePrompt = vi.fn();
const mockToggleFavorite = vi.fn();

const mockUserPrompt = {
  _id: 'up-1',
  title: 'My Custom Prompt',
  description: 'Custom user prompt for testing',
  template: 'Hello {{name}}',
  variables: ['name'],
  tags: ['testing'],
  isFavorite: false,
};

let mockStoreState = {
  prompts: [mockUserPrompt],
  isLoading: false,
  error: null,
  fetchPrompts: mockFetchPrompts,
  createPrompt: mockCreatePrompt,
  updatePrompt: mockUpdatePrompt,
  deletePrompt: mockDeletePrompt,
  toggleFavorite: mockToggleFavorite,
};

vi.mock('@/store/promptStore', () => ({
  usePromptStore: () => mockStoreState,
}));

vi.mock('@/store/uiStore', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('PromptsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState = {
      prompts: [mockUserPrompt],
      isLoading: false,
      error: null,
      fetchPrompts: mockFetchPrompts,
      createPrompt: mockCreatePrompt,
      updatePrompt: mockUpdatePrompt,
      deletePrompt: mockDeletePrompt,
      toggleFavorite: mockToggleFavorite,
    };
  });

  it('renders header, view tabs and category filters', () => {
    render(<PromptsPage />);

    expect(screen.getByText('Prompt Vault')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New Prompt/i })).toBeInTheDocument();

    // View tabs
    expect(screen.getByRole('tab', { name: /All/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /My Vault/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Starter Hub/i })).toBeInTheDocument();

    // Category pills
    expect(screen.getByRole('button', { name: 'All Templates' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Development' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Architecture & DB' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Debugging & Security' })).toBeInTheDocument();
  });

  it('filters by category when a category pill is clicked', () => {
    render(<PromptsPage />);

    // Click Development category
    const devPill = screen.getByRole('button', { name: 'Development' });
    fireEvent.click(devPill);

    // Should show Development starter prompt: Senior Code Reviewer
    expect(screen.getByText('Senior Code Reviewer')).toBeInTheDocument();
  });

  it('allows switching to My Vault tab', () => {
    render(<PromptsPage />);

    const vaultTab = screen.getByRole('tab', { name: /My Vault/i });
    fireEvent.click(vaultTab);

    // My custom prompt should be visible
    expect(screen.getByText('My Custom Prompt')).toBeInTheDocument();
    // Starters should not be in My Vault tab
    expect(screen.queryByText('Senior Code Reviewer')).not.toBeInTheDocument();
  });

  it('allows cloning a curated starter template to personal vault', () => {
    render(<PromptsPage />);

    // Switch to Starter Hub
    const starterTab = screen.getByRole('tab', { name: /Starter Hub/i });
    fireEvent.click(starterTab);

    // Find the Save button on Senior Code Reviewer
    const saveButtons = screen.getAllByRole('button', { name: /Save/i });
    expect(saveButtons.length).toBeGreaterThan(0);
    fireEvent.click(saveButtons[0]);

    expect(mockCreatePrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.any(String),
        template: expect.any(String),
      }),
    );
  });
});
