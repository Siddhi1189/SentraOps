import { AuthLayout } from '../features/auth/components/AuthLayout/AuthLayout';
import { LoginForm } from '../features/auth/components/LoginForm/LoginForm';

export function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
