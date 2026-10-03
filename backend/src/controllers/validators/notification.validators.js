import { z } from 'zod';
import { NotificationStatuses } from '../../constants.js';

const notificationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(Object.values(NotificationStatuses)).optional(),
});

const notificationIdParamSchema = z.object({
  id: z.string().uuid(),
});

export { notificationQuerySchema, notificationIdParamSchema };
export default { notificationQuerySchema, notificationIdParamSchema };
