import { z } from 'zod';
import { HttpMethods, PriorityLevels, EnvironmentTypes } from '../../constants.js';

const assertionSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('status_code_equals'),
    value: z.coerce.number().int().min(100).max(599),
  }),
  z.object({
    kind: z.literal('body_contains'),
    value: z.string().min(1),
  }),
  z.object({
    kind: z.literal('body_does_not_contain'),
    value: z.string().min(1),
  }),
  z.object({
    kind: z.literal('json_path_equals'),
    path: z.string().min(1),
    value: z.any(),
  }),
  z.object({
    kind: z.literal('response_time_less_than'),
    value: z.coerce.number().positive(),
  }),
]);

const createServiceSchema = z.object({
  name: z.string().min(1).max(255),
  monitorType: z.enum(['http', 'heartbeat']).default('http'),
  url: z.string().url().optional().nullable(),
  httpMethod: z.enum(Object.values(HttpMethods)).default('GET'),
  expectedStatusCode: z.number().int().min(100).max(599).default(200),
  timeoutMs: z.number().int().min(1000).max(60000).default(5000),
  checkIntervalSeconds: z.number().int().min(30).max(3600).default(60),
  environment: z.enum(Object.values(EnvironmentTypes)).default('production'),
  priority: z.enum(Object.values(PriorityLevels)).default('medium'),
  groupId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().default(true),
  tags: z.array(z.string().max(50)).optional().default([]),
  requestHeaders: z.record(z.string()).nullable().optional(),
  requestBody: z.string().nullable().optional(),
  assertions: z.array(assertionSchema).max(10, 'Maximum 10 assertions allowed per monitor').optional().default([]),
  heartbeatIntervalSeconds: z.number().int().min(30).max(86400).optional(),
  heartbeatGraceSeconds: z.number().int().min(0).max(86400).optional(),
}).refine((data) => {
  if (data.monitorType === 'http' && !data.url) {
    return false;
  }
  return true;
}, {
  message: 'URL is required for HTTP monitors',
  path: ['url'],
});

const updateServiceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  monitorType: z.enum(['http', 'heartbeat']).optional(),
  url: z.string().url().optional().nullable(),
  httpMethod: z.enum(Object.values(HttpMethods)).optional(),
  expectedStatusCode: z.number().int().min(100).max(599).optional(),
  timeoutMs: z.number().int().min(1000).max(60000).optional(),
  checkIntervalSeconds: z.number().int().min(30).max(3600).optional(),
  environment: z.enum(Object.values(EnvironmentTypes)).optional(),
  priority: z.enum(Object.values(PriorityLevels)).optional(),
  groupId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
  tags: z.array(z.string().max(50)).optional(),
  requestHeaders: z.record(z.string()).nullable().optional(),
  requestBody: z.string().nullable().optional(),
  assertions: z.array(assertionSchema).max(10, 'Maximum 10 assertions allowed per monitor').optional(),
  heartbeatIntervalSeconds: z.number().int().min(30).max(86400).optional(),
  heartbeatGraceSeconds: z.number().int().min(0).max(86400).optional(),
  updatedAt: z.string().datetime().optional(),
});

const createGroupSchema = z.object({
  name: z.string().min(1).max(255),
  parentGroupId: z.string().uuid().nullable().optional(),
});

const updateGroupSchema = createGroupSchema.partial();

const serviceQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  groupId: z.string().uuid().optional(),
  search: z.string().optional(),
});

const bulkActionBaseSchema = z.object({
  serviceIds: z.array(z.string().uuid()).min(1, 'At least one service ID must be provided'),
});

const bulkIntervalSchema = z.object({
  serviceIds: z.array(z.string().uuid()).min(1, 'At least one service ID must be provided'),
  checkIntervalSeconds: z.number().int().min(30, 'Interval must be at least 30 seconds').max(3600),
});

const bulkGroupSchema = z.object({
  serviceIds: z.array(z.string().uuid()).min(1, 'At least one service ID must be provided'),
  groupId: z.string().uuid().nullable().optional(),
});

export {
  assertionSchema,
  createServiceSchema,
  updateServiceSchema,
  createGroupSchema,
  updateGroupSchema,
  serviceQuerySchema,
  bulkActionBaseSchema,
  bulkIntervalSchema,
  bulkGroupSchema,
};
export default {
  assertionSchema,
  createServiceSchema,
  updateServiceSchema,
  createGroupSchema,
  updateGroupSchema,
  serviceQuerySchema,
  bulkActionBaseSchema,
  bulkIntervalSchema,
  bulkGroupSchema,
};
