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
    <section className="page-section">
      <div className="card-block" style={{ maxWidth: 480 }}>
        <h1>Verify email</h1>
        <p>
          Enter the verification code from your configured test mailbox.
        </p>

        <form onSubmit={onSubmit} className="form-stack">
          <label>
            <div>Verification code</div>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter code"
              autoComplete="one-time-code"
              required
            />
          </label>

          {errorMessage ? <div className="form-error">{errorMessage}</div> : null}
          {successMessage ? <div className="form-success">{successMessage}</div> : null}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying...' : 'Verify email'}
          </button>
        </form>

        <div style={{ marginTop: 16 }}>
          <button type="button" onClick={onResend} disabled={isResending}>
            {isResending ? 'Sending...' : 'Resend code'}
          </button>
        </div>
      </div>
    </section>
  );
}
