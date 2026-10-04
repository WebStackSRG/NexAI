import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useChatStore } from '@/store/chatStore';
import {
  Search,
  X,
  Bookmark,
  Terminal,
  MessageSquare,
  Clock,
  BookOpen,
  FileText,
  Layers,
  ArrowRight,
  RotateCcw,
  Paperclip,
  Mic,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useSearchStore } from '@/store/searchStore';
import { useDebounce } from '@/hooks/useDebounce';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils/cn';
import styles from './SearchPage.module.scss';

function HighlightedText({ text, query }) {
  if (!query || !query.trim() || !text) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className={styles.highlight}>
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

function getLibraryTypeTone(type) {
  switch (type) {
    case 'note':
      return 'neutral';
    case 'link':
      return 'info';
    case 'document':
      return 'accent';
    case 'file':
      return 'warning';
    case 'interview':
      return 'success';
    default:
      return 'neutral';
  }
}

function getLibraryTypeIcon(type) {
  switch (type) {
    case 'note':
      return <Bookmark size={13} />;
    case 'link':
      return <BookOpen size={13} />;
    case 'document':
      return <FileText size={13} />;
    case 'file':
      return <Paperclip size={13} />;
    case 'interview':
      return <Mic size={13} />;
    default:
      return <Bookmark size={13} />;
  }
}

export default function SearchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { chats: allChats, fetchChats } = useChatStore();

  const {
    query,
    activeTab,
    results,
    counts,
    isLoading,
    error,
    recentSearches,
    setQuery,
    setActiveTab,
    performSearch,
    clearSearch,
    removeRecentSearch,
    clearRecentSearches,
  } = useSearchStore();

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['all', 'library', 'prompts', 'chats'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search, setActiveTab]);

  const [localInput, setLocalInput] = useState(query);
  const debouncedInput = useDebounce(localInput, 300);

  // Trigger search on debounced input
  useEffect(() => {
    if (debouncedInput.trim()) {
      performSearch(debouncedInput.trim(), activeTab);
    } else {
      clearSearch();
    }
  }, [debouncedInput, activeTab, performSearch, clearSearch]);

  const handleClear = () => {
    setLocalInput('');
    clearSearch();
  };

  const handleRecentClick = (term) => {
    setLocalInput(term);
    setQuery(term);
    performSearch(term, activeTab);
  };

  const handleLibraryClick = (item) => {
    let tab = 'all';
    if (item.type === 'note' || item.type === 'link') tab = 'notes_links';
    else if (item.type === 'document') tab = 'documents';
    else if (item.type === 'file') tab = 'files';
    else if (item.type === 'interview') tab = 'interviews';
    navigate(`${ROUTES.LIBRARY}?tab=${tab}`);
  };

  const handlePromptClick = () => {
    navigate(ROUTES.PROMPTS);
  };

  const handleChatClick = (chat) => {
    navigate(`/chat/${chat.chatId || chat._id}`);
  };

  const showLibrary = activeTab === 'all' || activeTab === 'library';
  const showPrompts = activeTab === 'all' || activeTab === 'prompts';
  const showChats = activeTab === 'all' || activeTab === 'chats';

  const hasResults =
    (results.library && results.library.length > 0) ||
    (results.prompts && results.prompts.length > 0) ||
    (results.chats && results.chats.length > 0);

  return (
    <div className={styles.pageContainer}>
      <PageHeader
        title="Unified Search"
        description="Deep hybrid search across your personal library, generated documents, prompt vault, and conversations."
      />

      <div className={styles.searchHero}>
        <div className={styles.searchInputWrapper}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            value={localInput}
            onChange={(e) => setLocalInput(e.target.value)}
            placeholder={activeTab === 'chats' ? "Search conversations and chat history..." : "Search keywords, conceptual meaning, tags, or message history..."}
            className={styles.searchInput}
            autoFocus
          />
          {localInput && (
            <button
              onClick={handleClear}
              className={styles.clearButton}
              aria-label="Clear search"
              type="button"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Tab Filters */}
        <div className={styles.tabsBar}>
          <button
            type="button"
            className={cn(styles.tabItem, activeTab === 'all' && styles.active)}
            onClick={() => setActiveTab('all')}
          >
            <Layers size={15} />
            <span>All Results</span>
            <span className={styles.countBadge}>{counts.total}</span>
          </button>

          <button
            type="button"
            className={cn(styles.tabItem, activeTab === 'library' && styles.active)}
            onClick={() => setActiveTab('library')}
          >
            <Bookmark size={15} />
            <span>Library</span>
            <span className={styles.countBadge}>{counts.library}</span>
          </button>

          <button
            type="button"
            className={cn(styles.tabItem, activeTab === 'prompts' && styles.active)}
            onClick={() => setActiveTab('prompts')}
          >
            <Terminal size={15} />
            <span>Prompts</span>
            <span className={styles.countBadge}>{counts.prompts}</span>
          </button>

          <button
            type="button"
            className={cn(styles.tabItem, activeTab === 'chats' && styles.active)}
            onClick={() => setActiveTab('chats')}
          >
            <MessageSquare size={15} />
            <span>Chats</span>
            <span className={styles.countBadge}>{counts.chats}</span>
          </button>
        </div>

        {/* Recent Searches */}
        {!localInput && recentSearches && recentSearches.length > 0 && (
          <div className={styles.recentSection}>
            <div className={styles.recentHeader}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                <Clock size={13} />
                Recent Searches
              </span>
              <button
                type="button"
                onClick={clearRecentSearches}
                className={styles.clearAllBtn}
              >
                Clear all
              </button>
            </div>
            <div className={styles.recentChips}>
              {recentSearches.map((term) => (
                <div
                  key={term}
                  className={styles.recentChip}
                  onClick={() => handleRecentClick(term)}
                  role="button"
                  tabIndex={0}
                >
                  <span>{term}</span>
                  <button
                    type="button"
                    className={styles.removeChip}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecentSearch(term);
                    }}
                    aria-label={`Remove ${term}`}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className={styles.errorBanner}>
          <span>{error}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => performSearch(localInput, activeTab)}
          >
            <RotateCcw size={14} /> Retry
          </Button>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className={styles.skeletonGrid}>
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} height="140px" radius="md" />
          ))}
        </div>
      )}

      {/* Empty State: Initial Prompt for other tabs */}
      {!isLoading && !localInput.trim() && activeTab !== 'chats' && (
        <EmptyState
          icon={<Search size={32} />}
          title="Search your entire workspace"
          description="Type keywords, technical terms, or natural concepts. Unified Search combines vector semantic similarity with full-text indexing."
        />
      )}

      {/* Default Chat List when on Chats tab and no search query */}
      {!isLoading && !localInput.trim() && activeTab === 'chats' && (
        <div className={styles.categoryGroup}>
          <div className={styles.groupTitle}>
            <MessageSquare size={16} />
            <span>All Conversations ({allChats.length})</span>
          </div>
          <div className={styles.cardsList}>
            {allChats.length === 0 ? (
              <EmptyState
                icon={<MessageSquare size={32} />}
                title="No conversations yet"
                description="Start a new chat to begin exploring with NexAI."
                action={
                  <Button variant="primary" size="sm" onClick={() => navigate(ROUTES.CHAT)}>
                    Start New Chat
                  </Button>
                }
              />
            ) : (
              allChats.map((chat) => (
                <div
                  key={chat._id}
                  className={styles.resultCard}
                  onClick={() => handleChatClick(chat)}
                  role="button"
                  tabIndex={0}
                >
                  <div>
                    <div className={styles.cardHeader}>
                      <h4 className={styles.cardTitle}>{chat.title || 'Untitled Chat'}</h4>
                      {chat.pinned && <Badge tone="accent">Pinned</Badge>}
                    </div>

                    <p className={styles.cardSnippet}>
                      Click to resume this conversation and continue chatting.
                    </p>
                  </div>

                  <div className={styles.cardFooter}>
                    <span>{new Date(chat.updatedAt || chat.createdAt).toLocaleDateString()}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      Resume Chat <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Empty State: No Matches */}
      {!isLoading && localInput.trim() && !hasResults && !error && (
        <EmptyState
          icon={<Search size={32} />}
          title={`No results for "${localInput}"`}
          description="Try broadening your terms, checking for typos, or switching to the 'All Results' tab."
          action={
            <Button variant="secondary" size="sm" onClick={handleClear}>
              Clear Search
            </Button>
          }
        />
      )}

      {/* Search Results Display */}
      {!isLoading && hasResults && (
        <div className={styles.resultsGrid}>
          {/* Library Section */}
          {showLibrary && results.library && results.library.length > 0 && (
            <div className={styles.categoryGroup}>
              <div className={styles.groupTitle}>
                <Bookmark size={16} />
                <span>Knowledge Library ({results.library.length})</span>
              </div>
              <div className={styles.cardsList}>
                {results.library.map((item) => (
                  <div
                    key={item._id}
                    className={styles.resultCard}
                    onClick={() => handleLibraryClick(item)}
                    role="button"
                    tabIndex={0}
                  >
                    <div>
                      <div className={styles.cardHeader}>
                        <h4 className={styles.cardTitle}>
                          <HighlightedText text={item.title} query={localInput} />
                        </h4>
                        <Badge tone={getLibraryTypeTone(item.type)}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {getLibraryTypeIcon(item.type)}
                            {item.type}
                          </span>
                        </Badge>
                      </div>

                      <p className={styles.cardSnippet}>
                        <HighlightedText
                          text={item.summary || item.content || 'No description provided'}
                          query={localInput}
                        />
                      </p>
                    </div>

                    <div className={styles.cardFooter}>
                      <div className={styles.tagsContainer}>
                        {item.tags?.slice(0, 3).map((tag) => (
                          <span key={tag} className={styles.tagPill}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        View in Library <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prompts Section */}
          {showPrompts && results.prompts && results.prompts.length > 0 && (
            <div className={styles.categoryGroup}>
              <div className={styles.groupTitle}>
                <Terminal size={16} />
                <span>Prompt Vault ({results.prompts.length})</span>
              </div>
              <div className={styles.cardsList}>
                {results.prompts.map((prompt) => (
                  <div
                    key={prompt._id}
                    className={styles.resultCard}
                    onClick={handlePromptClick}
                    role="button"
                    tabIndex={0}
                  >
                    <div>
                      <div className={styles.cardHeader}>
                        <h4 className={styles.cardTitle}>
                          <HighlightedText text={prompt.title} query={localInput} />
                        </h4>
                        {prompt.isFavorite && <Badge tone="accent">Favorite</Badge>}
                      </div>

                      <p className={styles.cardSnippet}>
                        <HighlightedText
                          text={prompt.description || prompt.template}
                          query={localInput}
                        />
                      </p>
                    </div>

                    <div className={styles.cardFooter}>
                      <div className={styles.tagsContainer}>
                        {prompt.variables?.slice(0, 3).map((v) => (
                          <span key={v} className={styles.tagPill}>
                            &#123;&#123;{v}&#125;&#125;
                          </span>
                        ))}
                      </div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        Open in Vault <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chats Section */}
          {showChats && results.chats && results.chats.length > 0 && (
            <div className={styles.categoryGroup}>
              <div className={styles.groupTitle}>
                <MessageSquare size={16} />
                <span>Conversations ({results.chats.length})</span>
              </div>
              <div className={styles.cardsList}>
                {results.chats.map((chat) => (
                  <div
                    key={chat._id || chat.chatId}
                    className={styles.resultCard}
                    onClick={() => handleChatClick(chat)}
                    role="button"
                    tabIndex={0}
                  >
                    <div>
                      <div className={styles.cardHeader}>
                        <h4 className={styles.cardTitle}>
                          <HighlightedText text={chat.title} query={localInput} />
                        </h4>
                        {chat.matchType === 'message' && (
                          <Badge tone="neutral">Message Match</Badge>
                        )}
                      </div>

                      <p className={styles.cardSnippet}>
                        <HighlightedText text={chat.snippet} query={localInput} />
                      </p>
                    </div>

                    <div className={styles.cardFooter}>
                      <span>{new Date(chat.updatedAt || chat.createdAt).toLocaleDateString()}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        Resume Chat <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
