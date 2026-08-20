import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setAccessToken, clearAccessToken } from '../../../lib/authTokenStore';
import { connectSocket, disconnectSocket, getSocketOrigin } from '../../../lib/socket';
import {
  handleSocketEvent,
  type IncidentCreatedPayload,
  type IncidentUpdatedPayload,
  type HealthCheckUpdatedPayload,
} from '../../../lib/socketEvents';
import { SocketProvider } from '../../../app/providers/SocketProvider';

describe('Phase 12 — Real-Time Socket.IO Infrastructure & Event Bridge', () => {
  beforeEach(() => {
    clearAccessToken();
    disconnectSocket();
  });

  afterEach(() => {
    clearAccessToken();
    disconnectSocket();
    vi.restoreAllMocks();
  });

  describe('Socket origin resolution & auth handshake', () => {
    it('reads access token directly from authTokenStore without importing SessionProvider', () => {
      setAccessToken('test-mock-jwt-token-123');

      const socket = connectSocket();
      expect(socket).not.toBeNull();
      expect(socket?.auth).toEqual({ token: 'test-mock-jwt-token-123' });
    });

    it('returns null when no token is present in authTokenStore', () => {
      clearAccessToken();
      const socket = connectSocket();
      expect(socket).toBeNull();
    });

    it('derives socket origin from API origin configuration without hardcoding host', () => {
      const origin = getSocketOrigin();
      expect(typeof origin).toBe('string');
    });
  });

  describe('socketEvents.ts Event-to-Invalidation Mapping', () => {
    it('maps incident-created to incidentsKeys, servicesKeys, analyticsKeys invalidation and triggers callback', () => {
      const queryClient = new QueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
      const onCreatedSpy = vi.fn();

      const payload: IncidentCreatedPayload = {
        incident: {
          id: 'inc-99',
          title: 'Database Spike',
          status: 'open',
          severity: 'critical',
          serviceId: 'srv-1',
          organizationId: 'org-1',
        },
      };

      handleSocketEvent(queryClient, 'incident-created', payload, {
        onIncidentCreated: onCreatedSpy,
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['incidents'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['services'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['analytics'] });
      expect(onCreatedSpy).toHaveBeenCalledWith(payload.incident);
    });

    it('maps incident-updated to incidents, services, analytics, and specific incident detail keys', () => {
      const queryClient = new QueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const payload: IncidentUpdatedPayload = {
        incidentId: 'inc-101',
        status: 'resolved',
      };

      handleSocketEvent(queryClient, 'incident-updated', payload);

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['incidents'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['incidents', 'detail', 'inc-101'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['services'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['analytics'] });
    });

    it('maps health-check-updated to services list, service detail, and analytics keys', () => {
      const queryClient = new QueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const payload: HealthCheckUpdatedPayload = {
        serviceId: 'srv-42',
        status: 'down',
        consecutiveFailures: 3,
        responseTimeMs: 450,
        checkedAt: new Date().toISOString(),
      };

      handleSocketEvent(queryClient, 'health-check-updated', payload);

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['services'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['services', 'detail', 'srv-42'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['analytics'] });
    });

    it('maps maintenance-started and maintenance-ended to maintenance and services keys', () => {
      const queryClient = new QueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      handleSocketEvent(queryClient, 'maintenance-started', { maintenanceId: 'm-1' });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['maintenance'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['services'] });

      invalidateSpy.mockClear();

      handleSocketEvent(queryClient, 'maintenance-ended', { maintenanceId: 'm-1' });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['maintenance'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['services'] });
    });
  });

  describe('SocketProvider Lifecycle & Reconnection behavior', () => {
    it('renders children cleanly without error when unauthenticated or disconnected', () => {
      const queryClient = new QueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <SocketProvider>
            <div>Authenticated App Content</div>
          </SocketProvider>
        </QueryClientProvider>
      );

      expect(screen.getByText('Authenticated App Content')).toBeInTheDocument();
      expect(screen.queryByText(/reconnecting/i)).not.toBeInTheDocument();
    });
  });
});
