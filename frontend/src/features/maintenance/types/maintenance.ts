import { z } from 'zod';
import type { MaintenanceWindow, Service } from '../../../types/domain';

export const createMaintenanceSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(255, 'Title cannot exceed 255 characters'),
    description: z.string().optional(),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    serviceId: z.string().uuid().nullable().optional(),
  })
  .refine(
    (data) => {
      if (!data.startTime || !data.endTime) return true;
      return new Date(data.endTime).getTime() > new Date(data.startTime).getTime();
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  );

export const updateMaintenanceSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    serviceId: z.string().uuid().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return new Date(data.endTime).getTime() > new Date(data.startTime).getTime();
      }
      return true;
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  );

export const maintenanceQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type CreateMaintenancePayload = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenancePayload = z.infer<typeof updateMaintenanceSchema>;
export type MaintenanceQueryParams = z.infer<typeof maintenanceQuerySchema>;

export interface MaintenanceWindowDetail extends MaintenanceWindow {
  updatedAt?: string;
  service?: Service | null;
}

export type { MaintenanceWindow };
