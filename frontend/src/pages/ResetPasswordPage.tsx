import { AuthLayout } from '../features/auth/components/AuthLayout/AuthLayout';
import { ResetPasswordForm } from '../features/auth/components/ResetPasswordForm/ResetPasswordForm';

export function ResetPasswordPage() {
  return (
    <AuthLayout>
      <ResetPasswordForm />
    </AuthLayout>
  );
}
