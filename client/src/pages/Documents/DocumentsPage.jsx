import { FileText } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export default function DocumentsPage() {
  return (
    <div>
      <PageHeader
        title="Document Generator"
        description="AI-drafted structured documents with live preview and PDF export."
        actions={<Button variant="primary">New Document</Button>}
      />
      <EmptyState
        icon={<FileText size={28} />}
        title="No documents generated"
        description="Draft structured resumes, reports, and study notes with inline editing and instant PDF downloads."
      />
    </div>
  );
}
