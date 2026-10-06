import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255),
  platform: z.enum(['node', 'browser', 'other']).default('node'),
  environmentDefault: z.enum(['production', 'staging']).default('production'),
});

export const updateProjectSchema = createProjectSchema.partial();

export const createApiKeySchema = z.object({
  name: z.string().min(1, 'Key name is required').max(255).default('Default Key'),
});

export default {
  createProjectSchema,
  updateProjectSchema,
  createApiKeySchema,
};
