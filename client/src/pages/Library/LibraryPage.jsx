import { Bookmark } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export default function LibraryPage() {
  return (
    <div>
      <PageHeader
        title="Personal Library"
        description="Save links and notes with automated summaries, auto-tags, and semantic search."
        actions={<Button variant="primary">Add Item</Button>}
      />
      <EmptyState
        icon={<Bookmark size={28} />}
        title="No saved items yet"
        description="Save documentation, articles, or notes. Review AI-suggested summaries and tags before storing."
      />
    </div>
  );
}
