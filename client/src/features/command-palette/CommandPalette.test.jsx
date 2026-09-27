import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CommandPalette } from './CommandPalette';
import { searchApi } from '@/lib/api/search.api';

vi.mock('@/lib/api/search.api', () => ({
  searchApi: {
    unifiedSearch: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('CommandPalette Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders and displays navigation commands when open', () => {
    render(
      <MemoryRouter>
        <CommandPalette defaultOpen={true} />
      </MemoryRouter>,
    );

    expect(screen.getByPlaceholderText(/Type a command or search/i)).toBeInTheDocument();
    expect(screen.getByText('New Chat')).toBeInTheDocument();
    expect(screen.getByText('Personal Library')).toBeInTheDocument();
    expect(screen.getAllByText('Unified Search').length).toBeGreaterThan(0);
  });

  it('filters navigation actions and calls API for deep search queries', async () => {
    searchApi.unifiedSearch.mockResolvedValueOnce({
      data: {
        query: 'interview',
        counts: { total: 1, library: 1, prompts: 0, chats: 0 },
        library: [{ _id: 'lib-1', title: 'System Design Interview Note', type: 'note' }],
        prompts: [],
        chats: [],
      },
    });

    render(
      <MemoryRouter>
        <CommandPalette defaultOpen={true} />
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText(/Type a command or search/i);
    fireEvent.change(input, { target: { value: 'interview' } });

    await waitFor(() => {
      expect(searchApi.unifiedSearch).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'interview' }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText('System Design Interview Note')).toBeInTheDocument();
    });
  });

  it('navigates to selected route when a navigation item is clicked', () => {
    render(
      <MemoryRouter>
        <CommandPalette defaultOpen={true} />
      </MemoryRouter>,
    );

    const chatItem = screen.getByText('New Chat');
    fireEvent.click(chatItem);

    expect(mockNavigate).toHaveBeenCalledWith('/chat');
  });

  it('closes when escape key is pressed', () => {
    render(
      <MemoryRouter>
        <CommandPalette defaultOpen={true} />
      </MemoryRouter>,
    );

    expect(screen.getByPlaceholderText(/Type a command or search/i)).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/Type a command or search/i);
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByPlaceholderText(/Type a command or search/i)).not.toBeInTheDocument();
  });
});
