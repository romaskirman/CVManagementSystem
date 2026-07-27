import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import * as React from 'react';

export function AuthGuard() {
  const { isAuthenticated, isAuthorized, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="page-loader">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  if (!isAuthorized) {
    return <Navigate to="/verify-email" replace />;
  }

  return <Outlet />;
}
