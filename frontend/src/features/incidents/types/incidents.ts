import { z } from 'zod';
import type { Incident, IncidentStatus, IncidentSeverity, Service, User } from '../../../types/domain';

export const INCIDENT_STATUSES: IncidentStatus[] = [
  'open',
  'investigating',
  'identified',
  'monitoring',
  'resolved',
];

export const INCIDENT_SEVERITIES: IncidentSeverity[] = ['low', 'medium', 'high', 'critical'];

export const updateIncidentSchema = z.object({
  status: z.enum(['open', 'investigating', 'identified', 'monitoring', 'resolved']).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assignedUserId: z.string().uuid().nullable().optional(),
  rootCause: z.string().max(2000, 'Root cause cannot exceed 2000 characters').nullable().optional(),
  resolutionNotes: z
    .string()
    .max(2000, 'Resolution notes cannot exceed 2000 characters')
    .nullable()
    .optional(),
  updatedAt: z.string().optional(),
});

export const incidentQuerySchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
  status: z.enum(['open', 'investigating', 'identified', 'monitoring', 'resolved']).optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  serviceId: z.string().uuid().optional(),
});

export interface TimelineEvent {
  id: string;
  incidentId: string;
  eventType: string;
  description: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface IncidentDetail extends Incident {
  service?: Service;
  assignedUser?: User | null;
  timelineEvents?: TimelineEvent[];
}

export type UpdateIncidentPayload = z.infer<typeof updateIncidentSchema>;
export type IncidentQueryParams = z.infer<typeof incidentQuerySchema>;

export interface MemberQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}
