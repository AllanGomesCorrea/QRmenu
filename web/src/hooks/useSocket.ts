import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '@/stores/sessionStore';
import { useCartStore } from '@/stores/cartStore';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000/ws';

// Cooldown time in milliseconds (1 minute)
const COOLDOWN_TIME = 60 * 1000;

export interface SessionClosedData {
  sessionId: string;
  tableId: string;
  tableNumber: number;
  tableName: string;
  reason: 'payment_completed' | 'session_expired' | 'admin_closed';
  message: string;
  timestamp: string;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const sessionToken = useSessionStore((state) => state.sessionToken);
  const clearSession = useSessionStore((state) => state.clearSession);
  const clearCart = useCartStore((state) => state.clearCart);
  
  // Session closed state
  const [sessionClosed, setSessionClosed] = useState<SessionClosedData | null>(null);
  
  // Cooldown states
  const [waiterCooldown, setWaiterCooldown] = useState(0);
  const [billCooldown, setBillCooldown] = useState(0);
  
  // Cooldown timers refs
  const waiterTimerRef = useRef<NodeJS.Timeout | null>(null);
  const billTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cooldown countdown effect
  useEffect(() => {
    if (waiterCooldown > 0) {
      waiterTimerRef.current = setTimeout(() => {
        setWaiterCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (waiterTimerRef.current) clearTimeout(waiterTimerRef.current);
    };
  }, [waiterCooldown]);

  useEffect(() => {
    if (billCooldown > 0) {
      billTimerRef.current = setTimeout(() => {
        setBillCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (billTimerRef.current) clearTimeout(billTimerRef.current);
    };
  }, [billCooldown]);

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

    // Session closed event (when payment is completed)
    socket.on('session:closed', (data: SessionClosedData) => {
      console.log('👋 Session closed:', data);
      
      // Set the closed state to show the thank you modal
      setSessionClosed(data);
      
      // Clear local session and cart
      clearSession();
      clearCart();
      
      // Vibrate to notify user
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100, 50, 100]);
      }
    });

    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, [sessionToken, queryClient, clearSession, clearCart]);

  const callWaiter = useCallback((reason?: string): boolean => {
    // Check cooldown
    if (waiterCooldown > 0) {
      console.log(`⏳ Call waiter on cooldown: ${waiterCooldown}s remaining`);
      return false;
    }
    
    console.log('📢 Emitting table:call-waiter', { reason });
    socketRef.current?.emit('table:call-waiter', { reason });
    
    // Start cooldown (60 seconds)
    setWaiterCooldown(60);
    
    return true;
  }, [waiterCooldown]);

  const requestBill = useCallback((): boolean => {
    // Check cooldown
    if (billCooldown > 0) {
      console.log(`⏳ Request bill on cooldown: ${billCooldown}s remaining`);
      return false;
    }
    
    console.log('📢 Emitting table:request-bill');
    socketRef.current?.emit('table:request-bill', {});
    
    // Start cooldown (60 seconds)
    setBillCooldown(60);
    
    return true;
  }, [billCooldown]);

  const clearSessionClosed = useCallback(() => {
    setSessionClosed(null);
  }, []);

  return {
    socket: socketRef.current,
    callWaiter,
    requestBill,
    waiterCooldown,
    billCooldown,
    isWaiterOnCooldown: waiterCooldown > 0,
    isBillOnCooldown: billCooldown > 0,
    sessionClosed,
    clearSessionClosed,
  };
}
