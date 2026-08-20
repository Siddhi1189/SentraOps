import { getAccessToken, setAccessToken, clearAccessToken } from '../lib/authTokenStore';
import type { ApiSuccess, ApiError, RequestOptions } from '../types/api';

const BASE_URL = (import.meta.env.VITE_API_URL as string) || '/api/v1';

let refreshTokenPromise: Promise<string | null> | null = null;

async function performTokenRefresh(): Promise<string | null> {
  try {
    const refreshResult = await apiRequest<{ accessToken?: string; token?: string }>('/auth/refresh', {
      method: 'POST',
      isPublic: true,
    });
    const newToken = refreshResult.data.accessToken || refreshResult.data.token || null;
    if (newToken) {
      setAccessToken(newToken);
      return newToken;
    }
    clearAccessToken();
    return null;
  } catch {
    clearAccessToken();
    return null;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiSuccess<T>> {
  const { isPublic = false, body, headers: customHeaders, ...fetchOptions } = options;

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  // If not a public request, attach token if available
  if (!isPublic) {
    const token = getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const fetchInit: RequestInit = {
    ...fetchOptions,
    headers,
    credentials: isPublic ? 'omit' : 'include',
  };

  if (body !== undefined) {
    fetchInit.body = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(url, fetchInit);
  } catch (err) {
    const networkError: ApiError = {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Network request failed',
      },
      status: 0,
    };
    throw networkError;
  }

  // Handle HTTP 401 Unauthorized for authenticated requests (skip for public & refresh endpoint itself)
  const isRefreshEndpoint = endpoint.includes('/auth/refresh');
  if (response.status === 401 && !isPublic && !isRefreshEndpoint) {
    if (!refreshTokenPromise) {
      refreshTokenPromise = performTokenRefresh().finally(() => {
        refreshTokenPromise = null;
      });
    }

    const newToken = await refreshTokenPromise;
    if (!newToken) {
      const authError: ApiError = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Session expired',
        },
        status: 401,
      };
      throw authError;
    }

    // Retry original request with new token
    return apiRequest<T>(endpoint, {
      ...options,
      headers: {
        ...customHeaders,
        Authorization: `Bearer ${newToken}`,
      },
    });
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    const parseError: ApiError = {
      success: false,
      error: {
        code: 'PARSE_ERROR',
        message: 'Failed to parse response payload',
      },
      status: response.status,
    };
    throw parseError;
  }

  if (!response.ok || (typeof payload === 'object' && payload !== null && 'success' in payload && (payload as { success: boolean }).success === false)) {
    const errorPayload = payload as Partial<ApiError>;
    const formattedError: ApiError = {
      success: false,
      error: errorPayload.error || {
        code: `HTTP_${response.status}`,
        message: response.statusText || 'Request failed',
      },
      status: response.status,
    };
    throw formattedError;
  }

  return payload as ApiSuccess<T>;
}
