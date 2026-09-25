import { Terminal } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export default function PromptsPage() {
  return (
    <div>
      <PageHeader
        title="Prompt Vault"
        description="Reusable, variable-driven prompt templates with one-click filling."
        actions={<Button variant="primary">New Prompt</Button>}
      />
      <EmptyState
        icon={<Terminal size={28} />}
        title="Your vault is empty"
        description="Save prompts with {{variable}} placeholders to reuse standard templates across sessions."
      />
    </div>
  );
}
