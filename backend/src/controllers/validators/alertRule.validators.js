import { z } from 'zod';

export const serviceDownConditionsSchema = z.object({
  consecutiveFailures: z.number().int().min(1, 'Consecutive failures must be at least 1').default(3),
});

export const newIssueConditionsSchema = z.object({
  environment: z.string().trim().optional(),
});

export const eventRateConditionsSchema = z.object({
  threshold: z.number().int().min(1, 'Threshold must be at least 1'),
  windowSeconds: z.number().int().min(1).max(86400).default(60),
});

export const responseTimeConditionsSchema = z.object({
  thresholdMs: z.number().int().min(1, 'Threshold in ms must be at least 1').default(2000),
});

export const triggerConditionsSchemas = {
  service_down_consecutive_failures: serviceDownConditionsSchema,
  new_issue_in_environment: newIssueConditionsSchema,
  event_rate_threshold: eventRateConditionsSchema,
  response_time_threshold: responseTimeConditionsSchema,
};

export const createAlertRuleSchema = z.object({
  name: z.string().trim().min(1, 'Rule name is required').max(255),
  trigger: z.enum([
    'service_down_consecutive_failures',
    'new_issue_in_environment',
    'event_rate_threshold',
    'response_time_threshold',
  ]),
  conditions: z.record(z.any()).optional().default({}),
  serviceId: z.string().uuid().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  channelIds: z.array(z.string().uuid()).min(1, 'At least one notification channel is required'),
  cooldownSeconds: z.number().int().min(0).max(86400).default(300),
  isActive: z.boolean().optional().default(true),
}).superRefine((data, ctx) => {
  const schema = triggerConditionsSchemas[data.trigger];
  if (schema) {
    const parseResult = schema.safeParse(data.conditions || {});
    if (!parseResult.success) {
      for (const issue of parseResult.error.issues) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: issue.message,
          path: ['conditions', ...issue.path],
        });
      }
    }
  }
});

export const updateAlertRuleSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  trigger: z.enum([
    'service_down_consecutive_failures',
    'new_issue_in_environment',
    'event_rate_threshold',
    'response_time_threshold',
  ]).optional(),
  conditions: z.record(z.any()).optional(),
  serviceId: z.string().uuid().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  channelIds: z.array(z.string().uuid()).min(1).optional(),
  cooldownSeconds: z.number().int().min(0).max(86400).optional(),
  isActive: z.boolean().optional(),
});

export const snoozeAlertRuleSchema = z.object({
  until: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date/time for snooze until',
  }),
});
