import { Navigate } from 'react-router-dom';

/**
 * DocumentsPage redirects to the consolidated Library Hub filtered by tab=documents.
 */
export default function DocumentsPage() {
  return <Navigate to="/library?tab=documents" replace />;
}
