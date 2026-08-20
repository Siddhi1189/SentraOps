import { useState } from 'react';
import type React from 'react';
import { Link } from 'react-router-dom';
import { forgotPasswordSchema, type ForgotPasswordPayload } from '../../../../types/auth';
import { forgotPassword as forgotPasswordApi } from '../../../../api/auth';
import { Button } from '../../../../components/ui/Button/Button';
import { Input } from '../../../../components/ui/Input/Input';
import { Spinner } from '../../../../components/ui/Spinner/Spinner';
import { ErrorState } from '../../../../components/ui/ErrorState/ErrorState';
import type { ApiError } from '../../../../types/api';
import styles from './ForgotPasswordForm.module.css';

export function ForgotPasswordForm() {
  const [formData, setFormData] = useState<ForgotPasswordPayload>({ email: '' });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ForgotPasswordPayload, string>>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ email: e.target.value });
    setFieldErrors({});
    setGeneralError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setSuccessMessage(null);
    setFieldErrors({});

    const result = forgotPasswordSchema.safeParse(formData);
    if (!result.success) {
      const issue = result.error.issues[0];
      if (issue) {
        setFieldErrors({ email: issue.message });
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await forgotPasswordApi(formData);
      setSuccessMessage(res.data?.message || 'Password reset instructions sent if email exists.');
    } catch (err) {
      const apiErr = err as ApiError;
      setGeneralError(apiErr.error?.message || 'Failed to request password reset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div>
        <h2 className={styles.heading}>Reset password</h2>
        <p className={styles.subheading}>
          Enter your account email to receive a password reset link.
        </p>
      </div>

      {generalError && <ErrorState message={generalError} />}
      {successMessage && <div className={styles.successBanner} role="status">{successMessage}</div>}

      <Input
        label="Email address"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        error={fieldErrors.email}
        placeholder="you@company.com"
        required
      />

      <Button type="submit" variant="primary" className={styles.submitButton} disabled={isSubmitting}>
        {isSubmitting ? <Spinner size="sm" /> : 'Send Reset Link'}
      </Button>

      <div className={styles.linksRow}>
        <Link to="/login">Back to Sign In</Link>
      </div>
    </form>
  );
}
