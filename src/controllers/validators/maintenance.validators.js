import { z } from 'zod';

const createMaintenanceSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  serviceId: z.string().uuid().nullable().optional(),
});

const updateMaintenanceSchema = createMaintenanceSchema.partial();

const maintenanceQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export { createMaintenanceSchema, updateMaintenanceSchema, maintenanceQuerySchema };
export default { createMaintenanceSchema, updateMaintenanceSchema, maintenanceQuerySchema };
