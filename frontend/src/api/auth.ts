import { apiRequest } from './client';
import type { ApiSuccess } from '../types/api';
import type {
  RegisterPayload,
  LoginPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  AcceptInvitePayload,
  AuthSuccessResponse,
  RefreshTokenResponse,
  MeResponse,
  MessageResponse,
} from '../types/auth';

export async function register(data: RegisterPayload): Promise<ApiSuccess<AuthSuccessResponse>> {
  return apiRequest<AuthSuccessResponse>('/auth/register', {
    method: 'POST',
    isPublic: true,
    body: data,
  });
}

export async function login(data: LoginPayload): Promise<ApiSuccess<AuthSuccessResponse>> {
  return apiRequest<AuthSuccessResponse>('/auth/login', {
    method: 'POST',
    isPublic: true,
    body: data,
  });
}

export async function refresh(): Promise<ApiSuccess<RefreshTokenResponse>> {
  return apiRequest<RefreshTokenResponse>('/auth/refresh', {
    method: 'POST',
    isPublic: true,
  });
}

export async function logout(): Promise<ApiSuccess<MessageResponse>> {
  return apiRequest<MessageResponse>('/auth/logout', {
    method: 'POST',
  });
}

export async function getCurrentUser(): Promise<ApiSuccess<MeResponse>> {
  return apiRequest<MeResponse>('/auth/me', {
    method: 'GET',
  });
}

export async function forgotPassword(
  data: ForgotPasswordPayload
): Promise<ApiSuccess<MessageResponse>> {
  return apiRequest<MessageResponse>('/auth/forgot-password', {
    method: 'POST',
    isPublic: true,
    body: data,
  });
}

export async function resetPassword(
  data: ResetPasswordPayload
): Promise<ApiSuccess<MessageResponse>> {
  return apiRequest<MessageResponse>('/auth/reset-password', {
    method: 'POST',
    isPublic: true,
    body: data,
  });
}

export async function acceptInvite(
  data: AcceptInvitePayload
): Promise<ApiSuccess<AuthSuccessResponse>> {
  return apiRequest<AuthSuccessResponse>('/organizations/invite/accept', {
    method: 'POST',
    isPublic: true,
    body: data,
  });
}
