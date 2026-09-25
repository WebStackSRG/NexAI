import { useState } from 'react';
import { Search } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchBar } from '@/components/common/SearchBar';
import { EmptyState } from '@/components/ui/EmptyState';

export default function SearchPage() {
  const [query, setQuery] = useState('');

  return (
    <div>
      <PageHeader
        title="Unified Search"
        description="Search across your personal library, generated documents, and prompt vault."
      />
      <div style={{ marginBottom: 'var(--space-6)', maxWidth: 640 }}>
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search by keywords or semantic meaning..."
          autoFocus
        />
      </div>
      <EmptyState
        icon={<Search size={28} />}
        title={query ? `No results for "${query}"` : 'Enter a search term'}
        description="Search combines full-text indexing with vector similarity search for semantic retrieval."
      />
    </div>
  );
}
