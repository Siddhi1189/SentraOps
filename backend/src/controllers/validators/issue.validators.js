import { z } from 'zod';

export const updateIssueSchema = z.object({
  status: z.enum(['unresolved', 'resolved', 'ignored']).optional(),
  assignedUserId: z.string().uuid().nullable().optional(),
  currentUpdatedAt: z.string().optional(),
});

export const createIncidentFromIssueSchema = z.object({
  serviceId: z.string().uuid('Valid serviceId is required'),
  title: z.string().min(1).max(255).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
});

export const issueQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  status: z.enum(['unresolved', 'resolved', 'ignored']).optional(),
  environment: z.string().optional(),
  level: z.enum(['error', 'warning', 'info']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['lastSeen', 'eventCount']).default('lastSeen'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export default {
  updateIssueSchema,
  createIncidentFromIssueSchema,
  issueQuerySchema,
};
