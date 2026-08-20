import { AuthLayout } from '../features/auth/components/AuthLayout/AuthLayout';
import { RegisterForm } from '../features/auth/components/RegisterForm/RegisterForm';

export function RegisterPage() {
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  );
}
