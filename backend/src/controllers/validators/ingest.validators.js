import { z } from 'zod';

export const ingestEventSchema = z.object({
  type: z.string().min(1, 'Error type is required').max(100),
  message: z.string().min(1, 'Error message is required'),
  stack: z.string().max(20000, 'Stack trace exceeds maximum length of 20000 characters').optional().nullable(),
  level: z.enum(['error', 'warning', 'info']).default('error'),
  environment: z.string().max(50).default('production'),
  release: z.string().max(100).optional().nullable(),
  tags: z.record(z.any()).optional().default({}),
  breadcrumbs: z.array(z.any()).optional().default([]),
  user: z.record(z.any()).optional().nullable(),
  request: z.record(z.any()).optional().nullable(),
  occurredAt: z.union([z.string().datetime(), z.string().pipe(z.coerce.date())]).optional().nullable(),
});

export const ingestReleaseSchema = z.object({
  version: z.string().min(1, 'Version is required').max(100),
  commitSha: z.string().max(100).optional().nullable(),
  environment: z.string().max(50).default('production'),
  deployedAt: z.union([z.string().datetime(), z.string().pipe(z.coerce.date())]).optional().nullable(),
});

export default {
  ingestEventSchema,
  ingestReleaseSchema,
};
