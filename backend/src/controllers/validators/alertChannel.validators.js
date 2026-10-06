import { z } from 'zod';

export const createAlertChannelSchema = z.object({
  name: z.string().trim().min(1, 'Channel name is required').max(255),
  type: z.enum(['email', 'slack', 'webhook', 'discord']),
  config: z.record(z.any()).refine((cfg) => {
    // If slack or webhook, url is required
    return true;
  }),
  isActive: z.boolean().optional().default(true),
}).superRefine((data, ctx) => {
  if (data.type === 'slack' || data.type === 'webhook' || data.type === 'discord') {
    if (!data.config?.url || typeof data.config.url !== 'string') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${data.type.toUpperCase()} channel requires a valid "url" in config`,
        path: ['config', 'url'],
      });
    }
  } else if (data.type === 'email') {
    const recipients = data.config?.recipients;
    if (!recipients || (!Array.isArray(recipients) && typeof recipients !== 'string')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Email channel requires "recipients" list in config',
        path: ['config', 'recipients'],
      });
    }
  }
});

export const updateAlertChannelSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  type: z.enum(['email', 'slack', 'webhook', 'discord']).optional(),
  config: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
});
