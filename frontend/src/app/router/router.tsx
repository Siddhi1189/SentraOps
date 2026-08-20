import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { SessionProvider } from '../providers/SessionProvider';
import { ToastProvider } from '../providers/ToastProvider';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';
import { AuditLogGuard } from './AuditLogGuard';

// Public Website Pages
import { HomePage } from '../../pages/public/HomePage';
import { PlatformPage } from '../../pages/public/PlatformPage';
import { PublicServicesPage } from '../../pages/public/PublicServicesPage';
import { PublicIncidentsPage } from '../../pages/public/PublicIncidentsPage';
import { PublicMaintenancePage } from '../../pages/public/PublicMaintenancePage';
import { PublicAnalyticsPage } from '../../pages/public/PublicAnalyticsPage';
import { AboutPage } from '../../pages/public/AboutPage';
import { ContactPage } from '../../pages/public/ContactPage';

// Authentication Pages
import { LoginPage } from '../../pages/LoginPage';
import { RegisterPage } from '../../pages/RegisterPage';
import { ForgotPasswordPage } from '../../pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../../pages/ResetPasswordPage';
import { AcceptInvitePage } from '../../pages/AcceptInvitePage';

// Authenticated Application Console Pages
import { OverviewPage } from '../../pages/OverviewPage';
import { ServicesPage } from '../../pages/ServicesPage';
import { ServiceDetailPage } from '../../pages/ServiceDetailPage';
import { IncidentsPage } from '../../pages/IncidentsPage';
import { IncidentDetailPage } from '../../pages/IncidentDetailPage';
import { MaintenancePage } from '../../pages/MaintenancePage';
import { MaintenanceDetailPage } from '../../pages/MaintenanceDetailPage';
import { AnalyticsPage } from '../../pages/AnalyticsPage';
import { SettingsPage } from '../../pages/SettingsPage';
import { OrganizationPage } from '../../pages/OrganizationPage';
import { TeamPage } from '../../pages/TeamPage';
import { EscalationPoliciesPage } from '../../pages/EscalationPoliciesPage';
import { AuditLogPage } from '../../pages/AuditLogPage';

// Public Customer Status Pages
import { PublicStatusOverviewPage } from '../../pages/PublicStatusOverviewPage';
import { PublicStatusIncidentsPage } from '../../pages/PublicStatusIncidentsPage';
import { PublicStatusMaintenancePage } from '../../pages/PublicStatusMaintenancePage';

import { SocketProvider } from '../providers/SocketProvider';

function AuthenticatedAppShell() {
  return (
    <SessionProvider>
      <ToastProvider>
        <SocketProvider>
          <Outlet />
        </SocketProvider>
      </ToastProvider>
    </SessionProvider>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Unauthenticated Public Status Page Routes — Rendered OUTSIDE SessionProvider & ToastProvider */}
        <Route path="/status/:orgSlug" element={<PublicStatusOverviewPage />} />
        <Route path="/status/:orgSlug/incidents" element={<PublicStatusIncidentsPage />} />
        <Route path="/status/:orgSlug/maintenance" element={<PublicStatusMaintenancePage />} />
        <Route path="/status" element={<Navigate to="/status/acme-corp" replace />} />

        {/* Public Marketing Website Pages */}
        <Route path="/" element={<HomePage />} />
        <Route path="/platform" element={<PlatformPage />} />
        <Route path="/services" element={<PublicServicesPage />} />
        <Route path="/incidents" element={<PublicIncidentsPage />} />
        <Route path="/maintenance" element={<PublicMaintenancePage />} />
        <Route path="/analytics" element={<PublicAnalyticsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Authenticated Application Shell (mounts SessionProvider, ToastProvider, SocketProvider) */}
        <Route element={<AuthenticatedAppShell />}>
          {/* Public Auth Routes */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/accept-invite" element={<AcceptInvitePage />} />
          </Route>

          {/* Protected Application Console Routes under /app */}
          <Route path="/app" element={<ProtectedRoute />}>
            <Route index element={<OverviewPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="services/:id" element={<ServiceDetailPage />} />
            <Route path="incidents" element={<IncidentsPage />} />
            <Route path="incidents/:id" element={<IncidentDetailPage />} />
            <Route path="maintenance" element={<MaintenancePage />} />
            <Route path="maintenance/:id" element={<MaintenanceDetailPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="settings" element={<SettingsPage />}>
              <Route index element={<Navigate to="/app/settings/organization" replace />} />
              <Route path="organization" element={<OrganizationPage />} />
              <Route path="team" element={<TeamPage />} />
              <Route path="escalation-policies" element={<EscalationPoliciesPage />} />
              <Route
                path="audit-log"
                element={
                  <AuditLogGuard>
                    <AuditLogPage />
                  </AuditLogGuard>
                }
              />
            </Route>
          </Route>

          {/* Settings legacy redirect */}
          <Route path="/settings/*" element={<Navigate to="/app/settings/organization" replace />} />

          {/* Catch-all fallback to public home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
