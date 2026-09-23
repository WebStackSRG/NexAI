import { MessageSquare } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export default function ChatPage() {
  return (
    <div>
      <PageHeader
        title="AI Chat"
        description="Streaming conversations powered by Gemini with metered token usage."
      />
      <EmptyState
        icon={<MessageSquare size={28} />}
        title="Start a conversation"
        description="Ask questions, generate ideas, or analyze concepts. Credits are deducted from real API tokens."
        action={<Button variant="primary">New Chat</Button>}
      />
    </div>
  );
}
