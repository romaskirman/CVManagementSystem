import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { authApi } from '../../shared/api/auth.api';
import { useAuth } from '../../app/providers/AuthProvider';
import * as React from 'react';

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const { user, isLoading, isAuthenticated, isAuthorized, refetchMe } = useAuth();

  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  if (!isLoading && isAuthenticated && isAuthorized) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      await authApi.verifyEmail({
        code: code.trim()
      });

      const me = await refetchMe();

      if (me?.isAuthorized) {
        navigate('/', { replace: true });
        return;
      }

      setSuccessMessage('Email verified successfully.');
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.message ??
          error?.response?.data?.error ??
          'Failed to verify email.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onResend = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsResending(true);

    try {
      await authApi.resendVerificationCode({
        email: user?.email
      });
      setSuccessMessage('Verification code sent again.');
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.message ??
          error?.response?.data?.error ??
          'Failed to resend code.'
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <section className="page-section auth-page">
      <div className="card-block auth-card verify-email-card">
        <div className="auth-card__header">
          <h1 className="auth-card__title">Verify email</h1>
          <p className="auth-card__description verify-email-card__description">
            Enter the verification code sent to your email address to finish account setup.
          </p>
        </div>

        <form onSubmit={onSubmit} className="verify-email-form">
          <label className="verify-email-form__field">
            <span className="verify-email-form__label">Verification code</span>
            <input
              className="verify-email-form__input verify-email-form__input--code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter code"
              autoComplete="one-time-code"
              required
            />
          </label>

          {errorMessage ? <div className="auth-error">{errorMessage}</div> : null}
          {successMessage ? <div className="form-success verify-email-success">{successMessage}</div> : null}

          <button
            className="verify-email-form__submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Verifying...' : 'Verify email'}
          </button>
        </form>

        <div className="verify-email-actions">
          <button
            className="verify-email-actions__button"
            type="button"
            onClick={onResend}
            disabled={isResending}
          >
            {isResending ? 'Sending...' : 'Send code again'}
          </button>
        </div>

        <p className="verify-email-note">
          Signed in as {user?.email ?? 'your account'}.
        </p>
      </div>
    </section>
  );
}
