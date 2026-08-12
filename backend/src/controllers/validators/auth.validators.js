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

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

export { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema };
export default { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema };
