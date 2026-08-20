import type React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '../providers/SessionProvider';
import { can } from '../../permissions/can';

export interface AuditLogGuardProps {
  children?: React.ReactNode;
}

export function AuditLogGuard({ children }: AuditLogGuardProps) {
  const { user } = useSession();

  if (!can(user, 'audit:read')) {
    return <Navigate to="/settings/organization" replace />;
  }

  return <>{children || <Outlet />}</>;
}
