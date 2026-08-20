import { useState } from 'react';
import type React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerSchema, type RegisterPayload } from '../../../../types/auth';
import { register as registerApi } from '../../../../api/auth';
import { useSession } from '../../../../app/providers/SessionProvider';
import { Button } from '../../../../components/ui/Button/Button';
import { Input } from '../../../../components/ui/Input/Input';
import { Spinner } from '../../../../components/ui/Spinner/Spinner';
import { ErrorState } from '../../../../components/ui/ErrorState/ErrorState';
import type { ApiError } from '../../../../types/api';
import styles from './RegisterForm.module.css';

export function RegisterForm() {
  const navigate = useNavigate();
  const session = useSession();

  const [formData, setFormData] = useState<RegisterPayload>({
    organizationName: '',
    name: '',
    email: '',
    password: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RegisterPayload, string>>>({});
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

    const result = registerSchema.safeParse(formData);
    if (!result.success) {
      const formatted: Partial<Record<keyof RegisterPayload, string>> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof RegisterPayload;
        if (path && !formatted[path]) {
          formatted[path] = issue.message;
        }
      });
      setFieldErrors(formatted);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerApi(formData);
      const { user, organization, accessToken } = res.data;
      const effectiveOrg = organization || user.organization || {
        id: user.organizationId,
        name: formData.organizationName,
        slug: formData.organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      session.login(user, effectiveOrg, accessToken);
      navigate('/app');
    } catch (err) {
      const apiErr = err as ApiError;
      setGeneralError(apiErr.error?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.heading}>Create your account</h2>

      {generalError && <ErrorState message={generalError} />}

      <Input
        label="Organization name"
        type="text"
        name="organizationName"
        value={formData.organizationName}
        onChange={handleChange}
        error={fieldErrors.organizationName}
        placeholder="Acme Corp"
        required
      />

      <Input
        label="Your full name"
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        error={fieldErrors.name}
        placeholder="Jane Doe"
        required
      />

      <Input
        label="Email address"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        error={fieldErrors.email}
        autoComplete="email"
        placeholder="jane@acme.com"
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
        {isSubmitting ? <Spinner size="sm" /> : 'Get Started'}
      </Button>

      <div className={styles.linksRow}>
        <span>Already have an account? <Link to="/login">Sign in</Link></span>
      </div>
    </form>
  );
}
