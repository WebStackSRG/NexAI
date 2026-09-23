import { Link } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants/routes';

export default function NotFoundPage() {
  return (
    <div style={{ padding: 'var(--space-12) 0' }}>
      <EmptyState
        icon={<HelpCircle size={32} />}
        title="Page not found"
        description="The page you are looking for does not exist or has been moved."
        action={
          <Button as={Link} to={ROUTES.CHAT} variant="primary">
            Back to Chat
          </Button>
        }
      />
    </div>
  );
}
