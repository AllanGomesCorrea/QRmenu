import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '@/stores/sessionStore';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000/ws';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const sessionToken = useSessionStore((state) => state.sessionToken);

  useEffect(() => {
    if (!sessionToken) return;

    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      auth: { sessionToken },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('🔌 WebSocket connected');
    });

    socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Order events
    socket.on('order:confirmed', (data) => {
      console.log('✅ Order confirmed:', data);
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    });

    socket.on('order:preparing', (data) => {
      console.log('👨‍🍳 Order preparing:', data);
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    });

    socket.on('order:ready', (data) => {
      console.log('🍽️ Order ready:', data);
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      
      // Vibrate if supported
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    });

    socket.on('order:updated', (data) => {
      console.log('📦 Order updated:', data);
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    });

    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, [sessionToken, queryClient]);

  const callWaiter = useCallback((reason?: string) => {
    socketRef.current?.emit('table:call-waiter', { reason });
  }, []);

  const requestBill = useCallback(() => {
    socketRef.current?.emit('table:request-bill');
  }, []);

  return {
    socket: socketRef.current,
    callWaiter,
    requestBill,
  };
}

