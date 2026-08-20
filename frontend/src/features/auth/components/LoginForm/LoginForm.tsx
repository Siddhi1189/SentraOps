import { useState, useEffect } from 'react';
import type React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginSchema, type LoginPayload } from '../../../../types/auth';
import { login as loginApi } from '../../../../api/auth';
import { useSession } from '../../../../app/providers/SessionProvider';
import { Spinner } from '../../../../components/ui/Spinner/Spinner';
import { ErrorState } from '../../../../components/ui/ErrorState/ErrorState';
import type { ApiError } from '../../../../types/api';
import styles from './LoginForm.module.css';

export function LoginForm() {
  const navigate = useNavigate();
  const session = useSession();

  const [formData, setFormData] = useState<LoginPayload>({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginPayload, string>>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Handle browser back/forward cache (bfcache) restore cleanly
  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        setIsSubmitting(false);
        setGeneralError(null);
        setFieldErrors({});
      }
    }

    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

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

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const formatted: Partial<Record<keyof LoginPayload, string>> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof LoginPayload;
        if (path && !formatted[path]) {
          formatted[path] = issue.message;
        }
      });
      setFieldErrors(formatted);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginApi(formData);
      const { user, organization, accessToken } = res.data;
      const effectiveOrg = organization || user.organization || {
        id: user.organizationId,
        name: 'My Organization',
        slug: 'my-org',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      session.login(user, effectiveOrg, accessToken);
      navigate('/app');
    } catch (err) {
      const apiErr = err as ApiError;
      setGeneralError(apiErr.error?.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {/* Heading & Subtitle */}
      <div className={styles.headingGroup}>
        <h1 className={styles.heading} aria-label="Sign in to SentraOps">
          Welcome Back
        </h1>
        <p className={styles.subtext}>Sign in to access your SentraOps dashboard</p>
      </div>

      {generalError && <ErrorState message={generalError} />}

      {/* Email Address Field */}
      <div className={styles.fieldGroup}>
        <label htmlFor="email" className={styles.label}>
          Email Address
        </label>
        <div className={`${styles.inputWrap} ${fieldErrors.email ? styles.inputWrapError : ''}`}>
          <svg className={styles.fieldIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          <input
            id="email"
            type="email"
            name="email"
            className={styles.input}
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            placeholder="Enter your email address"
            required
          />
        </div>
        {fieldErrors.email && <span className={styles.fieldError}>{fieldErrors.email}</span>}
      </div>

      {/* Password Field */}
      <div className={styles.fieldGroup}>
        <div className={styles.labelRow}>
          <label htmlFor="password" className={styles.label}>
            Password
          </label>
          <Link to="/forgot-password" className={styles.forgotLink}>
            Forgot Password?
          </Link>
        </div>
        <div className={`${styles.inputWrap} ${fieldErrors.password ? styles.inputWrapError : ''}`}>
          <svg className={styles.fieldIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            className={styles.input}
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
            placeholder="Enter your password"
            required
          />
          <button
            type="button"
            className={styles.eyeToggle}
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        {fieldErrors.password && <span className={styles.fieldError}>{fieldErrors.password}</span>}
      </div>

      {/* Full-Width Solid Navy Submit Button */}
      <button
        type="submit"
        className={styles.submitBtn}
        disabled={isSubmitting}
        aria-label="Sign In"
      >
        {isSubmitting ? <Spinner size="sm" /> : 'Log In'}
      </button>

      {/* Divider with Register Link */}
      <div className={styles.dividerRow}>
        <span className={styles.dividerLine} />
        <span className={styles.dividerText}>
          Don&apos;t have an account?{' '}
          <Link to="/register" className={styles.signupLink}>
            Start Free Trial &rarr;
          </Link>
        </span>
        <span className={styles.dividerLine} />
      </div>
    </form>
  );
}
