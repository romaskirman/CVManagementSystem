import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import * as React from 'react';

export function AdminGuard() {
  const { user } = useAuth();

  if (!user?.roles.includes('ADMIN')) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
