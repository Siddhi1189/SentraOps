export type UserRole = 'owner' | 'admin' | 'viewer';
export type HttpMethod = 'GET' | 'POST' | 'HEAD' | 'PUT';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';
export type ServiceStatus = 'up' | 'down' | 'degraded' | 'maintenance' | 'unknown';
export type EnvironmentType = 'production' | 'staging';
export type IncidentStatus = 'open' | 'investigating' | 'identified' | 'monitoring' | 'resolved';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed';

export interface User {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  organization?: Organization | undefined;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceGroup {
  id: string;
  organizationId: string;
  name: string;
  parentGroupId: string | null;
  createdAt: string;
  updatedAt: string;
  parentGroup?: ServiceGroup | null;
  childGroups?: ServiceGroup[];
  services?: Service[];
}

export interface Service {
  id: string;
  organizationId: string;
  groupId: string | null;
  name: string;
  url: string;
  httpMethod: HttpMethod;
  expectedStatusCode: number;
  timeoutMs: number;
  checkIntervalSeconds: number;
  environment: EnvironmentType;
  priority: PriorityLevel;
  currentStatus: ServiceStatus;
  consecutiveFailures: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  group?: ServiceGroup | null;
}

export interface HealthCheck {
  id: string;
  serviceId: string;
  statusCode: number | null;
  responseTimeMs: number | null;
  isHealthy: boolean;
  errorMessage: string | null;
  checkedAt: string;
}

export interface Incident {
  id: string;
  organizationId: string;
  serviceId: string;
  assignedUserId: string | null;
  title: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  rootCause: string | null;
  resolutionNotes: string | null;
  detectedAt: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceWindow {
  id: string;
  organizationId: string;
  serviceId: string | null;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  status: MaintenanceStatus;
  createdAt: string;
}

export interface EscalationPolicy {
  id: string;
  organizationId: string;
  serviceId: string | null;
  warningThreshold: number;
  incidentThreshold: number;
  criticalThreshold: number;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user?: { id: string; name?: string; email?: string } | null;
}

export interface AnalyticsSummary {
  totalServices: number;
  upServices: number;
  downServices: number;
  degradedServices: number;
  openIncidents: number;
  uptimePercentage: number;
}
