import { z } from 'zod';

const registerSchema = z.object({
  organizationName: z.string().min(2).max(255),
  name: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export { registerSchema, loginSchema };
export default { registerSchema, loginSchema };
