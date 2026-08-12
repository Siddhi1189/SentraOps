import { z } from 'zod';
import { HttpMethods, PriorityLevels, EnvironmentTypes } from '../../constants.js';

const createServiceSchema = z.object({
  name: z.string().min(1).max(255),
  url: z.string().url(),
  httpMethod: z.enum(Object.values(HttpMethods)).default('GET'),
  expectedStatusCode: z.number().int().min(100).max(599).default(200),
  timeoutMs: z.number().int().min(1000).max(60000).default(5000),
  checkIntervalSeconds: z.number().int().min(30).max(3600).default(60),
  environment: z.enum(Object.values(EnvironmentTypes)).default('production'),
  priority: z.enum(Object.values(PriorityLevels)).default('medium'),
  groupId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().default(true),
  tags: z.array(z.string().max(50)).optional().default([]),
});

const updateServiceSchema = createServiceSchema.partial();

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

export { createServiceSchema, updateServiceSchema, createGroupSchema, updateGroupSchema, serviceQuerySchema };
export default {
  createServiceSchema,
  updateServiceSchema,
  createGroupSchema,
  updateGroupSchema,
  serviceQuerySchema,
};
