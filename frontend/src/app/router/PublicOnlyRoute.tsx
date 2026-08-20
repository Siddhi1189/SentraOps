import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '../providers/SessionProvider';
import { Spinner } from '../../components/ui/Spinner/Spinner';

export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useSession();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <Spinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
