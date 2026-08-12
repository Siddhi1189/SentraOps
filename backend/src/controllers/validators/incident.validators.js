import { z } from 'zod';
import { IncidentStatuses, IncidentSeverities } from '../../constants.js';

const updateIncidentSchema = z.object({
  status: z.enum(Object.values(IncidentStatuses)).optional(),
  severity: z.enum(Object.values(IncidentSeverities)).optional(),
  assignedUserId: z.string().uuid().nullable().optional(),
  rootCause: z.string().max(2000).nullable().optional(),
  resolutionNotes: z.string().max(2000).nullable().optional(),
  updatedAt: z.string().datetime().optional(), // For optimistic concurrency
});

const incidentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(Object.values(IncidentStatuses)).optional(),
  severity: z.enum(Object.values(IncidentSeverities)).optional(),
  serviceId: z.string().uuid().optional(),
});

export { updateIncidentSchema, incidentQuerySchema };
export default { updateIncidentSchema, incidentQuerySchema };
