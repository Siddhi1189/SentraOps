import { z } from 'zod';

const upsertPolicySchema = z.object({
  serviceId: z.string().uuid().nullable().optional(),
  warningThreshold: z.number().int().min(1),
  incidentThreshold: z.number().int().min(2),
  criticalThreshold: z.number().int().min(3),
});

export { upsertPolicySchema };
export default { upsertPolicySchema };
