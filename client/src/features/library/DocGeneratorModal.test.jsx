import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocGeneratorModal } from './DocGeneratorModal';
import { useLibraryStore } from '@/store/libraryStore';

vi.mock('@/store/authStore', () => ({
  useAuthStore: (selector) =>
    selector({
      user: { wallet: { creditsRemaining: 75 } },
    }),
}));

describe('DocGeneratorModal Component', () => {
  const mockGenerateDocDraft = vi.fn();
  const mockSaveItem = vi.fn();
  const mockExportPdf = vi.fn();
  const mockCloseModal = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useLibraryStore.setState({
      isDocGenModalOpen: true,
      closeDocGenModal: mockCloseModal,
      isGeneratingDoc: false,
      docDraft: null,
      generateDocDraft: mockGenerateDocDraft,
      saveItem: mockSaveItem,
      exportPdf: mockExportPdf,
      isSaving: false,
    });
  });

  it('renders Step 1 prompt setup with categories and starter prompts', () => {
    render(<DocGeneratorModal />);

    expect(screen.getByText('AI Document Generator')).toBeInTheDocument();
    expect(screen.getByText('1. Select Document Category')).toBeInTheDocument();
    expect(screen.getByText('Resume / CV')).toBeInTheDocument();
    expect(screen.getByText('Technical Spec')).toBeInTheDocument();
    expect(screen.getByText('Analysis Report')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate document draft/i })).toBeInTheDocument();
  });

  it('updates selected category and populates prompt from starter chip', () => {
    render(<DocGeneratorModal />);

    const resumeBtn = screen.getByText('Resume / CV');
    fireEvent.click(resumeBtn);

    const textarea = screen.getByPlaceholderText(/write a comprehensive specification/i);
    expect(textarea.value).toContain('Senior Full-Stack Engineer resume');
  });

  it('calls generateDocDraft when submit button is clicked', () => {
    render(<DocGeneratorModal />);

    const textarea = screen.getByPlaceholderText(/write a comprehensive specification/i);
    fireEvent.change(textarea, { target: { value: 'Custom architecture spec for NexAI' } });

    const submitBtn = screen.getByRole('button', { name: /generate document draft/i });
    fireEvent.click(submitBtn);

    expect(mockGenerateDocDraft).toHaveBeenCalledWith({
      prompt: 'Custom architecture spec for NexAI',
      category: 'spec',
    });
  });

  it('renders Step 2 split-pane editor and live preview when docDraft is present', () => {
    useLibraryStore.setState({
      isDocGenModalOpen: true,
      docDraft: {
        title: 'Distributed Cache Spec',
        category: 'spec',
        summary: 'In-memory Redis caching architecture.',
        sections: [
          { heading: 'Overview', body: 'Redis cluster configuration with sentinel.' },
          { heading: 'Eviction Policy', body: 'LRU eviction policy details.' },
        ],
      },
    });

    render(<DocGeneratorModal />);

    expect(screen.getByText('Review & Edit AI Document Draft')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Distributed Cache Spec')).toBeInTheDocument();
    expect(screen.getByDisplayValue('In-memory Redis caching architecture.')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Overview')).toBeInTheDocument();
    expect(screen.getByText('LIVE PREVIEW')).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: /save to library/i });
    fireEvent.click(saveBtn);

    expect(mockSaveItem).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'document',
        title: 'Distributed Cache Spec',
        category: 'spec',
      }),
    );
  });
});
