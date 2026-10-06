import { z } from 'zod';

const updateStatusPageSettingsSchema = z.object({
  subdomain: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/i, 'Subdomain must contain only alphanumeric characters and hyphens')
    .optional(),
  customDomain: z.string().max(255).nullable().optional(),
  logoUrl: z.string().url('Must be a valid URL').nullable().or(z.literal('')).optional(),
  theme: z.string().max(50).optional(),
});

export { updateStatusPageSettingsSchema };
export default { updateStatusPageSettingsSchema };
