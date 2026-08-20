import { useState } from 'react';
import type React from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { acceptInviteSchema, type AcceptInvitePayload } from '../../../../types/auth';
import { acceptInvite as acceptInviteApi } from '../../../../api/auth';
import { useSession } from '../../../../app/providers/SessionProvider';
import { Button } from '../../../../components/ui/Button/Button';
import { Input } from '../../../../components/ui/Input/Input';
import { Spinner } from '../../../../components/ui/Spinner/Spinner';
import { ErrorState } from '../../../../components/ui/ErrorState/ErrorState';
import type { ApiError } from '../../../../types/api';
import styles from './AcceptInviteForm.module.css';

export function AcceptInviteForm() {
  const navigate = useNavigate();
  const session = useSession();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [formData, setFormData] = useState<AcceptInvitePayload>({
    token,
    name: '',
    password: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof AcceptInvitePayload, string>>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    setGeneralError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    const payload: AcceptInvitePayload = { ...formData, token: token || formData.token };
    const result = acceptInviteSchema.safeParse(payload);

    if (!result.success) {
      const formatted: Partial<Record<keyof AcceptInvitePayload, string>> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof AcceptInvitePayload;
        if (path) {
          formatted[path] = issue.message;
        }
      });
      setFieldErrors(formatted);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await acceptInviteApi(payload);
      const { user, organization, accessToken } = res.data;
      const effectiveOrg = organization || user.organization || {
        id: user.organizationId,
        name: 'Organization',
        slug: 'org',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      session.login(user, effectiveOrg, accessToken);
      navigate('/app');
    } catch (err) {
      const apiErr = err as ApiError;
      setGeneralError(apiErr.error?.message || 'Failed to accept invitation. The link may be invalid.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token && !formData.token) {
    return (
      <div className={styles.form}>
        <ErrorState
          title="Invalid Invitation"
          message="No invitation token was provided in the URL."
        />
        <div className={styles.linksRow}>
          <Link to="/login">Sign in to your account</Link>
        </div>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div>
        <h2 className={styles.heading}>Accept Invitation</h2>
        <p className={styles.subheading}>Complete your profile to join your team.</p>
      </div>

      {generalError && <ErrorState message={generalError} />}

      <Input
        label="Your Full Name"
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        error={fieldErrors.name}
        placeholder="Jane Doe"
        required
      />

      <div className={styles.passwordWrapper}>
        <Input
          label="Password (min 8 chars)"
          type={showPassword ? 'text' : 'password'}
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={fieldErrors.password}
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

      <Button type="submit" variant="primary" className={styles.submitButton} disabled={isSubmitting}>
        {isSubmitting ? <Spinner size="sm" /> : 'Accept & Sign In'}
      </Button>

      <div className={styles.linksRow}>
        <Link to="/login">Already have an account? Sign in</Link>
      </div>
    </form>
  );
}
