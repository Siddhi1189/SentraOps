export type IssueStatus = 'unresolved' | 'resolved' | 'ignored';
export type IssueLevel = 'error' | 'warning' | 'info';
export type PlatformType = 'node' | 'browser' | 'other';

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  platform: PlatformType;
  environmentDefault: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: string;
  projectId: string;
  name: string;
  keyPrefix: string;
  key?: string; // Revealed only upon creation
  lastUsedAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
}

export interface Release {
  id: string;
  projectId: string;
  version: string;
  commitSha?: string | null;
  deployedAt: string;
  environment: string;
  createdAt: string;
}

export interface ErrorEventDetail {
  id: string;
  projectId: string;
  issueId: string;
  type: string;
  message: string;
  stack?: string | null;
  environment: string;
  release?: string | null;
  releaseId?: string | null;
  releaseRef?: Release | null;
  level: IssueLevel;
  tags: Record<string, string>;
  breadcrumbs: Array<{
    category: string;
    message: string;
    level?: string;
    timestamp: string;
    data?: Record<string, any>;
  }>;
  user?: {
    id?: string;
    email?: string;
    username?: string;
    [key: string]: any;
  } | null;
  request?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    query?: Record<string, any>;
    [key: string]: any;
  } | null;
  occurredAt: string;
  receivedAt: string;
}

export interface Issue {
  id: string;
  projectId: string;
  organizationId: string;
  fingerprint: string;
  title: string;
  type: string;
  level: IssueLevel;
  status: IssueStatus;
  environment: string;
  firstSeenAt: string;
  lastSeenAt: string;
  eventCount: number;
  userCount: number;
  assignedUserId?: string | null;
  resolvedAt?: string | null;
  resolvedInRelease?: string | null;
  regressedInRelease?: string | null;
  isRegression: boolean;
  linkedIncidentId?: string | null;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
    platform: PlatformType;
  } | null;
  assignedUser?: {
    id: string;
    name: string;
    email: string;
  } | null;
  linkedIncident?: {
    id: string;
    title: string;
    status: string;
    severity: string;
  } | null;
  errorEvents?: ErrorEventDetail[];
}

export interface IssueQueryParams {
  projectId?: string;
  status?: IssueStatus;
  environment?: string;
  level?: IssueLevel;
  search?: string;
  sortBy?: 'lastSeen' | 'eventCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface UpdateIssuePayload {
  status?: IssueStatus;
  assignedUserId?: string | null;
  currentUpdatedAt?: string;
}

export interface CreateIncidentFromIssuePayload {
  serviceId: string;
  title?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}
