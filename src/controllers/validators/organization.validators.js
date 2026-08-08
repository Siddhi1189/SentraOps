import { z } from 'zod';
import { UserRoles } from '../../constants.js';

const inviteMemberSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  role: z.enum([UserRoles.ADMIN, UserRoles.VIEWER]),
});

const updateMemberRoleSchema = z.object({
  role: z.enum([UserRoles.ADMIN, UserRoles.VIEWER]),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export { inviteMemberSchema, updateMemberRoleSchema, paginationSchema };
export default { inviteMemberSchema, updateMemberRoleSchema, paginationSchema };
