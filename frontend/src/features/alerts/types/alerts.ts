export type NotificationChannelType = 'email' | 'slack' | 'webhook' | 'discord';

export type AlertRuleTriggerType =
  | 'service_down_consecutive_failures'
  | 'new_issue_in_environment'
  | 'event_rate_threshold'
  | 'response_time_threshold';

export interface AlertChannel {
  id: string;
  organizationId: string;
  name: string;
  type: NotificationChannelType;
  config: {
    url?: string;
    recipients?: string[] | string;
    [key: string]: unknown;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  rules?: Array<{ id: string; name: string }>;
}

export interface AlertRuleFire {
  id: string;
  ruleId: string;
  firedAt: string;
  context?: Record<string, unknown>;
}

export interface AlertRuleConditions {
  consecutiveFailures?: number;
  environment?: string;
  threshold?: number;
  windowSeconds?: number;
  thresholdMs?: number;
  [key: string]: unknown;
}

export interface AlertRule {
  id: string;
  organizationId: string;
  name: string;
  trigger: AlertRuleTriggerType;
  conditions: AlertRuleConditions;
  serviceId: string | null;
  projectId: string | null;
  cooldownSeconds: number;
  snoozedUntil: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastFiredAt: string | null;
  channels: AlertChannel[];
  service?: { id: string; name: string } | null;
  project?: { id: string; name: string } | null;
}

export interface CreateAlertChannelPayload {
  name: string;
  type: NotificationChannelType;
  config: Record<string, unknown>;
  isActive?: boolean;
}

export interface UpdateAlertChannelPayload {
  name?: string;
  type?: NotificationChannelType;
  config?: Record<string, unknown>;
  isActive?: boolean;
}

export interface CreateAlertRulePayload {
  name: string;
  trigger: AlertRuleTriggerType;
  conditions?: AlertRuleConditions;
  serviceId?: string | null;
  projectId?: string | null;
  channelIds: string[];
  cooldownSeconds?: number;
  isActive?: boolean;
}

export interface UpdateAlertRulePayload {
  name?: string;
  trigger?: AlertRuleTriggerType;
  conditions?: AlertRuleConditions;
  serviceId?: string | null;
  projectId?: string | null;
  channelIds?: string[];
  cooldownSeconds?: number;
  isActive?: boolean;
}
