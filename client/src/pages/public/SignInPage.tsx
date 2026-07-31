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
    <section className="page-section auth-page">
      <div className="card-block auth-card">
        <div className="auth-card__header">
          <h1 className="auth-card__title">Sign in</h1>
          <p className="auth-card__description">
            Use your account credentials to continue.
          </p>
        </div>

        {oauthError ? (
          <div className="auth-error">OAuth sign-in failed. Please try again.</div>
        ) : null}

        <form onSubmit={onSubmit} className="auth-form">
          <label className="auth-form__field">
            <span className="auth-form__label">Email</span>
            <input
              className="auth-form__input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="auth-form__field">
            <span className="auth-form__label">Password</span>
            <input
              className="auth-form__input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              required
            />
          </label>

          {errorMessage ? <div className="auth-error">{errorMessage}</div> : null}

          <button className="auth-form__submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="auth-divider">Or continue with</div>

        <div className="auth-socials">
          <button
            className="auth-socials__button"
            type="button"
            onClick={() => authApi.startGoogleOAuth()}
          >
            Continue with Google
          </button>

          <button
            className="auth-socials__button"
            type="button"
            onClick={() => authApi.startGithubOAuth()}
          >
            Continue with GitHub
          </button>
        </div>

        <p className="auth-footer">
          Don&apos;t have an account?{' '}
          <Link className="auth-footer__link" to="/register">
            Create one
          </Link>
        </p>
      </div>
    </section>
  );
}
