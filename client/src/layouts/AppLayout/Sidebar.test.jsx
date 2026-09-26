import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useUiStore } from '@/store/uiStore';

describe('Sidebar Component', () => {
  beforeEach(() => {
    localStorage.clear();
    useUiStore.setState({
      isSidebarCollapsed: false,
    });
    useAuthStore.setState({
      user: {
        email: 'developer@nexai.local',
        role: 'user',
        wallet: { creditsRemaining: 150, tier: 'free' },
      },
      isAuthenticated: true,
    });
    useChatStore.setState({
      chats: [
        { _id: 'chat-1', title: 'React Architecture Review', createdAt: new Date().toISOString() },
        { _id: 'chat-2', title: 'Python Web Scraping', createdAt: new Date().toISOString() },
      ],
      activeChatId: 'chat-1',
      isLoadingChats: false,
      fetchChats: vi.fn(),
      selectChat: vi.fn(),
      updateChatTitle: vi.fn(),
      deleteChat: vi.fn(),
    });
  });

  it('renders expanded sidebar brand, primary navigation, recents, and user card', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    // Brand and primary action
    expect(screen.getByText('NexAI')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+ new chat/i })).toBeInTheDocument();

    // Primary nav items
    expect(screen.getByRole('link', { name: /chat/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /library/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /prompts/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /interview/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /wallet/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();

    // Non-admin user should NOT see Admin link
    expect(screen.queryByRole('link', { name: /admin/i })).not.toBeInTheDocument();

    // Recents
    expect(screen.getByText('React Architecture Review')).toBeInTheDocument();
    expect(screen.getByText('Python Web Scraping')).toBeInTheDocument();

    // User info and wallet
    expect(screen.getByText('developer')).toBeInTheDocument();
    expect(screen.getByText('Free Tier')).toBeInTheDocument();
  });

  it('renders Admin link when user has admin role', () => {
    useAuthStore.setState({
      user: {
        email: 'admin@nexai.local',
        role: 'admin',
        wallet: { creditsRemaining: 999, tier: 'pro_monthly' },
      },
      isAuthenticated: true,
    });

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /admin/i })).toBeInTheDocument();
  });

  it('toggles collapsible state smoothly', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    const toggleBtn = screen.getByRole('button', { name: /collapse sidebar/i });
    expect(toggleBtn).toBeInTheDocument();

    fireEvent.click(toggleBtn);
    expect(useUiStore.getState().isSidebarCollapsed).toBe(true);

    // In collapsed state, "+ New chat" is an icon button
    expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new chat/i })).toBeInTheDocument();
  });

  it('filters recent chat list with search input', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    const searchInput = screen.getByLabelText(/search chats/i);
    expect(searchInput).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'React' } });

    expect(screen.getByText('React Architecture Review')).toBeInTheDocument();
    expect(screen.queryByText('Python Web Scraping')).not.toBeInTheDocument();
  });

  it('triggers onItemClick when rendered in mobile drawer', () => {
    const handleItemClick = vi.fn();

    render(
      <MemoryRouter>
        <Sidebar onItemClick={handleItemClick} isMobile />
      </MemoryRouter>,
    );

    // In mobile mode, collapse toggle is hidden
    expect(screen.queryByRole('button', { name: /collapse sidebar/i })).not.toBeInTheDocument();

    const libraryLink = screen.getByRole('link', { name: /library/i });
    fireEvent.click(libraryLink);

    expect(handleItemClick).toHaveBeenCalled();
  });
});
