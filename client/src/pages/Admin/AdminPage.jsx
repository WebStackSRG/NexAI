import { Shield } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminPage() {
  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        description="System metrics, token consumption analysis, and error telemetry."
      />
      <EmptyState
        icon={<Shield size={28} />}
        title="Admin Telemetry"
        description="View real-time token consumption, Flash vs Pro usage distribution, error logs, and system latency."
      />
    </div>
  );
}
