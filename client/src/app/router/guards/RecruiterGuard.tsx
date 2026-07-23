import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import * as React from 'react';

export function RecruiterGuard() {
  const { user } = useAuth();

  const canAccess =
    user?.roles.includes('RECRUITER') || user?.roles.includes('ADMIN');

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
