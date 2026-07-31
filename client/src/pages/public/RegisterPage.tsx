import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { authApi } from '../../shared/api/auth.api';
import { useAuth } from '../../app/providers/AuthProvider';
import * as React from 'react';

export function RegisterPage() {
  const navigate = useNavigate();
  const { refetchMe, isAuthenticated, isAuthorized, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoading && isAuthenticated && isAuthorized) {
    return <Navigate to="/" replace />;
  }

  if (!isLoading && isAuthenticated && !isAuthorized) {
    return <Navigate to="/verify-email" replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await authApi.register({
        email: email.trim(),
        password
      });

      const me = await refetchMe();

      if (me && !me.isAuthorized) {
        navigate('/verify-email', { replace: true });
        return;
      }

      navigate('/', { replace: true });
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.message ??
          error?.response?.data?.error ??
          'Failed to register.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="page-section auth-page">
      <div className="card-block auth-card">
        <div className="auth-card__header">
          <h1 className="auth-card__title">Register</h1>
          <p className="auth-card__description">
            Create an account to manage CVs, profiles and positions.
          </p>
        </div>

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
              placeholder="Create password"
              autoComplete="new-password"
              required
            />
          </label>

          <label className="auth-form__field">
            <span className="auth-form__label">Confirm password</span>
            <input
              className="auth-form__input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              autoComplete="new-password"
              required
            />
          </label>

          {errorMessage ? <div className="auth-error">{errorMessage}</div> : null}

          <button className="auth-form__submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link className="auth-footer__link" to="/signin">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
