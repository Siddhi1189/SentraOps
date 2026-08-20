import { AuthLayout } from '../features/auth/components/AuthLayout/AuthLayout';
import { ForgotPasswordForm } from '../features/auth/components/ForgotPasswordForm/ForgotPasswordForm';

export function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
