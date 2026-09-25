import PropTypes from 'prop-types';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants/routes';

export function AdminRoute({ children }) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--color-bg-app)',
        }}
      >
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (user?.role !== 'admin') {
    return (
      <div
        data-testid="admin-forbidden-403"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: 'var(--space-6)',
        }}
      >
        <EmptyState
          icon={<ShieldAlert size={48} color="var(--color-danger)" />}
          title="403 - Access Forbidden"
          description="You do not have administrative permissions to view this dashboard."
          action={
            <Button variant="primary" onClick={() => navigate(ROUTES.CHAT)}>
              Return to Workspace
            </Button>
          }
        />
      </div>
    );
  }

  return children;
}

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
