import { AuthLayout } from '../features/auth/components/AuthLayout/AuthLayout';
import { AcceptInviteForm } from '../features/auth/components/AcceptInviteForm/AcceptInviteForm';

export function AcceptInvitePage() {
  return (
    <AuthLayout>
      <AcceptInviteForm />
    </AuthLayout>
  );
}
