export const servicesKeys = {
  all: ['services'] as const,
  lists: () => [...servicesKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...servicesKeys.lists(), { filters }] as const,
  details: () => [...servicesKeys.all, 'detail'] as const,
  detail: (id: string) => [...servicesKeys.details(), id] as const,
  groups: () => [...servicesKeys.all, 'groups'] as const,
  groupList: (filters?: Record<string, unknown>) => [...servicesKeys.groups(), 'list', { filters }] as const,
  healthChecks: (serviceId: string, filters?: Record<string, unknown>) =>
    [...servicesKeys.detail(serviceId), 'health-checks', { filters }] as const,
};

export const incidentsKeys = {
  all: ['incidents'] as const,
  lists: () => [...incidentsKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...incidentsKeys.lists(), { filters }] as const,
  details: () => [...incidentsKeys.all, 'detail'] as const,
  detail: (id: string) => [...incidentsKeys.details(), id] as const,
  timeline: (id: string) => [...incidentsKeys.detail(id), 'timeline'] as const,
};

export const maintenanceKeys = {
  all: ['maintenance'] as const,
  lists: () => [...maintenanceKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...maintenanceKeys.lists(), { filters }] as const,
  details: () => [...maintenanceKeys.all, 'detail'] as const,
  detail: (id: string) => [...maintenanceKeys.details(), id] as const,
};

export const analyticsKeys = {
  all: ['analytics'] as const,
  summary: () => [...analyticsKeys.all, 'summary'] as const,
  service: (serviceId: string) => [...analyticsKeys.all, 'service', serviceId] as const,
  incidents: (filters?: Record<string, unknown>) => [...analyticsKeys.all, 'incidents', { filters }] as const,
};

export const organizationsKeys = {
  all: ['organizations'] as const,
  current: () => [...organizationsKeys.all, 'current'] as const,
  members: (filters?: Record<string, unknown>) => [...organizationsKeys.all, 'members', { filters }] as const,
};

export const escalationPolicyKeys = {
  all: ['escalation-policies'] as const,
  lists: () => [...escalationPolicyKeys.all, 'list'] as const,
  detail: (id: string) => [...escalationPolicyKeys.all, 'detail', id] as const,
};

export const auditKeys = {
  all: ['audit-logs'] as const,
  lists: () => [...auditKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...auditKeys.lists(), { filters }] as const,
};

/** Reserved for Phase 11 Public Status Page queries */
export const statusKeys = {
  all: ['status'] as const,
  overview: (orgSlug: string) => [...statusKeys.all, orgSlug, 'overview'] as const,
  incidents: (orgSlug: string) => [...statusKeys.all, orgSlug, 'incidents'] as const,
  maintenance: (orgSlug: string) => [...statusKeys.all, orgSlug, 'maintenance'] as const,
};

export const notificationsKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationsKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...notificationsKeys.lists(), { filters }] as const,
};

export const statusPageSettingsKeys = {
  all: ['status-page-settings'] as const,
  settings: () => [...statusPageSettingsKeys.all, 'current'] as const,
};

export const issuesKeys = {
  all: ['issues'] as const,
  lists: () => [...issuesKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...issuesKeys.lists(), { filters }] as const,
  details: () => [...issuesKeys.all, 'detail'] as const,
  detail: (id: string) => [...issuesKeys.details(), id] as const,
  events: (id: string, filters?: Record<string, unknown>) => [...issuesKeys.detail(id), 'events', { filters }] as const,
};

export const projectsKeys = {
  all: ['projects'] as const,
  lists: () => [...projectsKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...projectsKeys.lists(), { filters }] as const,
  details: () => [...projectsKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectsKeys.details(), id] as const,
  keys: (id: string) => [...projectsKeys.detail(id), 'keys'] as const,
};

export const alertChannelsKeys = {
  all: ['alert-channels'] as const,
  lists: () => [...alertChannelsKeys.all, 'list'] as const,
  detail: (id: string) => [...alertChannelsKeys.all, 'detail', id] as const,
};

export const alertRulesKeys = {
  all: ['alert-rules'] as const,
  lists: () => [...alertRulesKeys.all, 'list'] as const,
  detail: (id: string) => [...alertRulesKeys.all, 'detail', id] as const,
};

