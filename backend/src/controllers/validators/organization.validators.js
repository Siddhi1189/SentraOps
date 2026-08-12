import { z } from 'zod';
import { UserRoles } from '../../constants.js';

const inviteMemberSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255).optional(),
  role: z.enum([UserRoles.ADMIN, UserRoles.VIEWER]),
});

const acceptInviteSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1).max(255),
  password: z.string().min(8).max(100),
});

const updateMemberRoleSchema = z.object({
  role: z.enum([UserRoles.ADMIN, UserRoles.VIEWER]),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export { inviteMemberSchema, acceptInviteSchema, updateMemberRoleSchema, paginationSchema };
export default { inviteMemberSchema, acceptInviteSchema, updateMemberRoleSchema, paginationSchema };
