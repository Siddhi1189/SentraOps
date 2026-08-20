import { z } from 'zod';
import type { User, Organization } from './domain';

export const registerSchema = z.object({
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters').max(255),
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Invite token is required'),
  name: z.string().min(1, 'Name is required').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

export type RegisterPayload = z.infer<typeof registerSchema>;
export type LoginPayload = z.infer<typeof loginSchema>;
export type ForgotPasswordPayload = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordPayload = z.infer<typeof resetPasswordSchema>;
export type AcceptInvitePayload = z.infer<typeof acceptInviteSchema>;

export interface AuthSuccessResponse {
  user: User;
  organization?: Organization;
  accessToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface MeResponse {
  user: User & { organization?: Organization };
}

export interface MessageResponse {
  message: string;
}
