import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import * as React from 'react';

export function CandidateGuard() {
  const { user } = useAuth();

  if (!user?.roles.includes('CANDIDATE')) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
