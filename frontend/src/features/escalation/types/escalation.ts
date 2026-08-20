import { z } from 'zod';
import type { EscalationPolicy } from '../../../types/domain';

export const upsertEscalationPolicySchema = z
  .object({
    serviceId: z.string().uuid().nullable().optional(),
    warningThreshold: z.coerce.number().int().min(1, 'Warning threshold must be at least 1 failure'),
    incidentThreshold: z.coerce.number().int().min(2, 'Incident threshold must be at least 2 failures'),
    criticalThreshold: z.coerce.number().int().min(3, 'Critical threshold must be at least 3 failures'),
  })
  .refine(
    (data) => data.warningThreshold < data.incidentThreshold,
    {
      message: 'Warning threshold must be strictly less than incident threshold',
      path: ['warningThreshold'],
    }
  )
  .refine(
    (data) => data.incidentThreshold < data.criticalThreshold,
    {
      message: 'Incident threshold must be strictly less than critical threshold',
      path: ['incidentThreshold'],
    }
  );

export type UpsertEscalationPolicyPayload = z.infer<typeof upsertEscalationPolicySchema>;

export type { EscalationPolicy };
