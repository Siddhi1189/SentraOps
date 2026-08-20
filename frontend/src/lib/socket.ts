/**
 * VERIFIED BACKEND REAL-TIME CONTRACT DOCUMENTATION
 *
 * Source Inspection References:
 * - backend/src/config/socket.js (Socket.IO initialization & JWT handshake)
 * - backend/src/index.js (Redis subscriber -> Socket.IO emitToOrg relay)
 * - backend/worker/processors/healthCheck.processor.js (Health check execution & incident events)
 * - backend/worker/processors/maintenance.processor.js (Maintenance window start/end events)
 *
 * Confirmed Handshake Mechanism:
 * - Token location: auth: { token: "<access_token>" }
 * - Server middleware verifies token via verifyAccessToken(token).
 * - Room behavior: On connection, server automatically joins room `org_${organizationId}`.
 *
 * Confirmed Real-Time Events & Payload Shapes:
 * 1. 'incident-created': { incident: { id, title, status, severity, serviceId, organizationId, ... } }
 * 2. 'incident-updated': { incidentId, status?, severity?, resolvedAt? }
 * 3. 'health-check-updated': { serviceId, status, consecutiveFailures, responseTimeMs, errorMessage?, checkedAt }
 * 4. 'maintenance-started': { maintenanceId?, serviceId? }
 * 5. 'maintenance-ended': { maintenanceId? }
 */

import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from './authTokenStore';

let socket: Socket | null = null;

/**
 * Derive Socket.IO connection origin from existing frontend API URL configuration
 * without hardcoding environment hosts.
 */
export function getSocketOrigin(): string {
  const apiUrl = (import.meta.env.VITE_API_URL as string) || '';
  if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
    try {
      const url = new URL(apiUrl);
      return url.origin;
    } catch {
      // Fallback if URL parsing fails
    }
  }
  return typeof window !== 'undefined' ? window.location.origin : '';
}

/**
 * Connect to Socket.IO using the current access token from authTokenStore.
 * Framework-independent: never imports SessionProvider or React Context.
 */
export function connectSocket(): Socket | null {
  const token = getAccessToken();
  if (!token) {
    disconnectSocket();
    return null;
  }

  // If already connected with an active socket, return existing
  if (socket && socket.connected) {
    return socket;
  }

  const origin = getSocketOrigin();

  socket = io(origin, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ['websocket', 'polling'],
  });

  return socket;
}

/**
 * Disconnect socket cleanly and remove instance reference.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

/**
 * Get active socket instance.
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Helper to check socket connection state.
 */
export function isSocketConnected(): boolean {
  return Boolean(socket && socket.connected);
}
