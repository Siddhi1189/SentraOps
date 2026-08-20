import { useState } from 'react';
import type React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPasswordSchema, type ResetPasswordPayload } from '../../../../types/auth';
import { resetPassword as resetPasswordApi } from '../../../../api/auth';
import { Button } from '../../../../components/ui/Button/Button';
import { Input } from '../../../../components/ui/Input/Input';
import { Spinner } from '../../../../components/ui/Spinner/Spinner';
import { ErrorState } from '../../../../components/ui/ErrorState/ErrorState';
import type { ApiError } from '../../../../types/api';
import styles from './ResetPasswordForm.module.css';

export function ResetPasswordForm() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [formData, setFormData] = useState<ResetPasswordPayload>({
    token,
    newPassword: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ResetPasswordPayload, string>>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, newPassword: e.target.value }));
    setFieldErrors({});
    setGeneralError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setSuccessMessage(null);
    setFieldErrors({});

    const payload: ResetPasswordPayload = { ...formData, token: token || formData.token };
    const result = resetPasswordSchema.safeParse(payload);

    if (!result.success) {
      const formatted: Partial<Record<keyof ResetPasswordPayload, string>> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof ResetPasswordPayload;
        if (path) {
          formatted[path] = issue.message;
        }
      });
      setFieldErrors(formatted);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await resetPasswordApi(payload);
      setSuccessMessage(res.data?.message || 'Password has been reset successfully. You can now sign in.');
    } catch (err) {
      const apiErr = err as ApiError;
      setGeneralError(apiErr.error?.message || 'Failed to reset password. The link may be expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token && !formData.token) {
    return (
      <div className={styles.form}>
        <ErrorState
          title="Invalid Link"
          message="No password reset token was provided in the URL."
        />
        <div className={styles.linksRow}>
          <Link to="/forgot-password">Request a new reset link</Link>
        </div>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div>
        <h2 className={styles.heading}>Set new password</h2>
        <p className={styles.subheading}>Enter your new password below.</p>
      </div>

      {generalError && <ErrorState message={generalError} />}
      {successMessage && <div className={styles.successBanner} role="status">{successMessage}</div>}

      <div className={styles.passwordWrapper}>
        <Input
          label="New Password (min 8 chars)"
          type={showPassword ? 'text' : 'password'}
          name="newPassword"
          value={formData.newPassword}
          onChange={handleChange}
          error={fieldErrors.newPassword}
          autoComplete="new-password"
          required
        />
        <button
          type="button"
          className={styles.toggleButton}
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>

      <Button type="submit" variant="primary" className={styles.submitButton} disabled={isSubmitting || !!successMessage}>
        {isSubmitting ? <Spinner size="sm" /> : 'Reset Password'}
      </Button>

      <div className={styles.linksRow}>
        <Link to="/login">Sign in to your account</Link>
      </div>
    </form>
  );
}
