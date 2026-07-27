import { FormEvent, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../../shared/api/auth.api';
import { useAuth } from '../../app/providers/AuthProvider';
import * as React from 'react';

type LocationState = {
  from?: {
    pathname?: string;
    search?: string;
    hash?: string;
  };
};

export function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refetchMe, isAuthenticated, isAuthorized, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const oauthError = new URLSearchParams(location.search).get('oauthError');

  const redirectTo = useMemo(() => {
    const state = location.state as LocationState | null;
    const from = state?.from;

    if (!from?.pathname || from.pathname === '/signin') {
      return '/';
    }

    return `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`;
  }, [location.state]);

  if (!isLoading && isAuthenticated && isAuthorized) {
    return <Navigate to={redirectTo} replace />;
  }

  if (!isLoading && isAuthenticated && !isAuthorized) {
    return <Navigate to="/verify-email" replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await authApi.login({
        email: email.trim(),
        password
      });

      const me = await refetchMe();

      if (me && !me.isAuthorized) {
        navigate('/verify-email', { replace: true });
        return;
      }

      navigate(redirectTo, { replace: true });
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.message ??
          error?.response?.data?.error ??
          'Failed to sign in.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="page-section">
      <div className="card-block" style={{ maxWidth: 480 }}>
        <h1>Sign in</h1>
        <p>Use your account credentials to continue.</p>

        {oauthError ? (
          <div className="form-error">OAuth sign-in failed. Please try again.</div>
        ) : null}

        <form onSubmit={onSubmit} className="form-stack">
          <label>
            <div>Email</div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            <div>Password</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              required
            />
          </label>

          {errorMessage ? <div className="form-error">{errorMessage}</div> : null}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="form-stack" style={{ marginTop: 16 }}>
          <button type="button" onClick={() => authApi.startGoogleOAuth()}>
            Continue with Google
          </button>
          <button type="button" onClick={() => authApi.startGithubOAuth()}>
            Continue with GitHub
          </button>
        </div>

        <p style={{ marginTop: 16 }}>
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </section>
  );
}
