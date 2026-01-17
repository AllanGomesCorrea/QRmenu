import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000/ws';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (!token) return;

    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      auth: { token },
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
    socket.on('order:created', (data) => {
      console.log('📦 New order:', data);
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-stats'] });
      
      // Play notification sound
      playNotificationSound();
    });

    socket.on('order:updated', (data) => {
      console.log('📦 Order updated:', data);
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    });

    socket.on('order:cancelled', (data) => {
      console.log('❌ Order cancelled:', data);
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-stats'] });
    });

    socket.on('order:item:updated', (data) => {
      console.log('📦 Order item updated:', data);
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    });

    // Table events
    socket.on('table:waiter-called', (data) => {
      console.log('🔔 Waiter called:', data);
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      
      // Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Mesa ${data.tableNumber}`, {
          body: data.reason || 'Cliente chamando garçom',
          icon: '/favicon.ico',
        });
      }
      
      playNotificationSound();
    });

    socket.on('table:bill-requested', (data) => {
      console.log('💳 Bill requested:', data);
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Mesa ${data.tableNumber}`, {
          body: 'Cliente solicitou a conta',
          icon: '/favicon.ico',
        });
      }
      
      playNotificationSound();
    });

    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, [token, queryClient]);

  const joinKitchen = useCallback(() => {
    socketRef.current?.emit('staff:join-kitchen');
  }, []);

  const leaveKitchen = useCallback(() => {
    socketRef.current?.emit('staff:leave-kitchen');
  }, []);

  return {
    socket: socketRef.current,
    joinKitchen,
    leaveKitchen,
  };
}

function playNotificationSound() {
  try {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (error) {
    console.log('Could not play notification sound');
  }
}

