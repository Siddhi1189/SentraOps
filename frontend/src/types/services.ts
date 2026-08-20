import { z } from 'zod';

export const createServiceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be 255 characters or less'),
  url: z.string().url('Must be a valid URL (e.g. https://api.example.com/health)'),
  httpMethod: z.enum(['GET', 'POST', 'HEAD', 'PUT']).default('GET'),
  expectedStatusCode: z
    .number()
    .int()
    .min(100, 'Status code must be at least 100')
    .max(599, 'Status code must be at most 599')
    .default(200),
  timeoutMs: z
    .number()
    .int()
    .min(1000, 'Timeout must be at least 1,000ms')
    .max(60000, 'Timeout must be at most 60,000ms')
    .default(5000),
  checkIntervalSeconds: z
    .number()
    .int()
    .min(30, 'Interval must be at least 30 seconds')
    .max(3600, 'Interval must be at most 3,600 seconds')
    .default(60),
  environment: z.enum(['production', 'staging']).default('production'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  groupId: z.string().uuid('Invalid group ID').nullable().optional(),
  isActive: z.boolean().default(true),
  tags: z.array(z.string().max(50, 'Tag length max 50 chars')).optional().default([]),
});

export const updateServiceSchema = createServiceSchema.partial();

export const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(255, 'Group name max 255 chars'),
  parentGroupId: z.string().uuid('Invalid parent group ID').nullable().optional(),
});

export const updateGroupSchema = createGroupSchema.partial();

export const serviceQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  groupId: z.string().uuid().optional(),
  search: z.string().optional(),
});

export type CreateServicePayload = z.infer<typeof createServiceSchema>;
export type UpdateServicePayload = z.infer<typeof updateServiceSchema>;
export type CreateGroupPayload = z.infer<typeof createGroupSchema>;
export type UpdateGroupPayload = z.infer<typeof updateGroupSchema>;
export type ServiceQueryParams = z.infer<typeof serviceQuerySchema>;
