import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectSocket, disconnectSocket, isSocketConnected } from '../../lib/socket';
import { handleSocketEvent, type IncidentCreatedPayload } from '../../lib/socketEvents';
import { LiveIncidentToast, type LiveIncidentNotification } from '../../components/ui/Toast/LiveIncidentToast';

export interface SocketContextValue {
  isConnected: boolean;
  isReconnecting: boolean;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export interface SocketProviderProps {
  children: React.ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<LiveIncidentNotification[]>([]);
  const isIntentionalDisconnect = useRef<boolean>(false);

  const handleDismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  useEffect(() => {
    isIntentionalDisconnect.current = false;
    const socket = connectSocket();

    if (!socket) {
      setIsConnected(false);
      return;
    }

    const onConnect = () => {
      setIsConnected(true);
      setIsReconnecting(false);
    };

    const onDisconnect = (reason: string) => {
      setIsConnected(false);
      // Only show reconnecting status if disconnect was unexpected, NOT intentional logout
      if (!isIntentionalDisconnect.current && reason !== 'io client disconnect') {
        setIsReconnecting(true);
      }
    };

    const onReconnectAttempt = () => {
      if (!isIntentionalDisconnect.current) {
        setIsReconnecting(true);
      }
    };

    const onReconnectFailed = () => {
      setIsReconnecting(false);
    };

    // Generic listener for all real-time events
    const handleIncomingEvent = (eventName: string, payload: unknown) => {
      handleSocketEvent(queryClient, eventName, payload, {
        onIncidentCreated: (incident: IncidentCreatedPayload['incident']) => {
          if (incident && incident.id) {
            setNotifications((prev) => [
              ...prev,
              { id: `${incident.id}-${Date.now()}`, incident },
            ]);
          }
        },
      });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect_attempt', onReconnectAttempt);
    socket.io.on('reconnect_failed', onReconnectFailed);

    // Listened event topics from backend contract
    const eventTopics = [
      'incident-created',
      'incident-updated',
      'health-check-updated',
      'maintenance-started',
      'maintenance-ended',
    ];

    eventTopics.forEach((topic) => {
      socket.on(topic, (payload: unknown) => handleIncomingEvent(topic, payload));
    });

    // Check initial connection status
    setIsConnected(isSocketConnected());

    return () => {
      isIntentionalDisconnect.current = true;
      eventTopics.forEach((topic) => {
        socket.off(topic);
      });
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
      socket.io.off('reconnect_failed', onReconnectFailed);
      disconnectSocket();
      setIsConnected(false);
      setIsReconnecting(false);
    };
  }, [queryClient]);

  const value: SocketContextValue = {
    isConnected,
    isReconnecting,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
      {isReconnecting && (
        <div
          style={{
            position: 'fixed',
            bottom: '16px',
            left: '16px',
            zIndex: 9998,
            backgroundColor: 'var(--color-bg-surface, #ffffff)',
            border: '1px solid var(--color-warning-border, #eab308)',
            color: 'var(--color-warning, #ca8a04)',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '0.8125rem',
            fontWeight: 600,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          aria-live="polite"
        >
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#eab308' }} />
          Reconnecting real-time stream…
        </div>
      )}
      <LiveIncidentToast notifications={notifications} onDismiss={handleDismissNotification} />
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextValue {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
