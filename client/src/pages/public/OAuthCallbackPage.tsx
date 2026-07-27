import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import * as React from 'react';

export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const { isLoading, refetchMe } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const resolveAuth = async () => {
      try {
        const me = await refetchMe();

        if (!isMounted) {
          return;
        }

        if (!me) {
          navigate('/signin?oauthError=1', { replace: true });
          return;
        }

        if (!me.isAuthorized) {
          navigate('/verify-email', { replace: true });
          return;
        }

        navigate('/', { replace: true });
      } catch {
        if (isMounted) {
          navigate('/signin?oauthError=1', { replace: true });
        }
      }
    };

    resolveAuth();

    return () => {
      isMounted = false;
    };
  }, [navigate, refetchMe]);

  if (isLoading) {
    return <div className="page-loader">Completing sign-in...</div>;
  }

  return <div className="page-loader">Completing sign-in...</div>;
}
