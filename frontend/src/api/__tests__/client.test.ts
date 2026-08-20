import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/msw/server';
import { apiRequest } from '../client';
import { setAccessToken, getAccessToken } from '../../lib/authTokenStore';

describe('API Client', () => {
  beforeEach(() => {
    setAccessToken(null);
  });

  it('parses successful response envelope correctly', async () => {
    server.use(
      http.get('/api/v1/test-success', () => {
        return HttpResponse.json({
          success: true,
          data: { id: '123', name: 'Test Entity' },
        });
      })
    );

    const res = await apiRequest<{ id: string; name: string }>('/test-success');
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ id: '123', name: 'Test Entity' });
  });

  it('parses error response envelope into typed ApiError', async () => {
    server.use(
      http.get('/api/v1/test-error', () => {
        return HttpResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Resource not found',
            },
          },
          { status: 404 }
        );
      })
    );

    try {
      await apiRequest('/test-error');
      expect.fail('Should have thrown an error');
    } catch (err: any) {
      expect(err.success).toBe(false);
      expect(err.status).toBe(404);
      expect(err.error.code).toBe('NOT_FOUND');
      expect(err.error.message).toBe('Resource not found');
    }
  });

  it('does NOT attach Authorization header in public mode', async () => {
    let capturedAuthHeader: string | null = 'INITIAL';

    server.use(
      http.get('/api/v1/public-endpoint', ({ request }) => {
        capturedAuthHeader = request.headers.get('Authorization');
        return HttpResponse.json({
          success: true,
          data: { message: 'public response' },
        });
      })
    );

    setAccessToken('some-initial-token');

    await apiRequest('/public-endpoint', { isPublic: true });
    expect(capturedAuthHeader).toBeNull();
  });

  it('issues exactly ONE refresh call when N concurrent requests fail with 401', async () => {
    setAccessToken('expired-token');
    let refreshCallCount = 0;

    server.use(
      http.post('/api/v1/auth/refresh', () => {
        refreshCallCount++;
        return HttpResponse.json({
          success: true,
          data: { accessToken: 'new-valid-token' },
        });
      }),
      http.get('/api/v1/protected-resource', ({ request }) => {
        const auth = request.headers.get('Authorization');
        if (auth === 'Bearer new-valid-token') {
          return HttpResponse.json({
            success: true,
            data: { message: 'success with new token' },
          });
        }
        return HttpResponse.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: 'Token expired' } },
          { status: 401 }
        );
      })
    );

    // Trigger 5 concurrent requests that return 401 initially
    const results = await Promise.all([
      apiRequest<{ message: string }>('/protected-resource'),
      apiRequest<{ message: string }>('/protected-resource'),
      apiRequest<{ message: string }>('/protected-resource'),
      apiRequest<{ message: string }>('/protected-resource'),
      apiRequest<{ message: string }>('/protected-resource'),
    ]);

    expect(refreshCallCount).toBe(1);
    expect(getAccessToken()).toBe('new-valid-token');
    results.forEach((res) => {
      expect(res.data.message).toBe('success with new token');
    });
  });

  it('clears token and rejects pending requests without recursive refresh if refresh itself fails', async () => {
    setAccessToken('expired-token');
    let refreshCallCount = 0;

    server.use(
      http.post('/api/v1/auth/refresh', () => {
        refreshCallCount++;
        return HttpResponse.json(
          { success: false, error: { code: 'REFRESH_EXPIRED', message: 'Session expired' } },
          { status: 401 }
        );
      }),
      http.get('/api/v1/protected-resource-2', () => {
        return HttpResponse.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: 'Token expired' } },
          { status: 401 }
        );
      })
    );

    await expect(apiRequest('/protected-resource-2')).rejects.toMatchObject({
      success: false,
      status: 401,
    });

    expect(refreshCallCount).toBe(1);
    expect(getAccessToken()).toBeNull();
  });
});
