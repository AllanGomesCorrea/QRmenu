import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TableSession {
  id: string;
  customerName: string;
  customerPhone: string;
  isVerified: boolean;
  tableId: string;
  tableNumber: number;
  restaurantId: string;
  restaurantSlug: string;
  restaurantName: string;
}

interface SessionState {
  session: TableSession | null;
  sessionToken: string | null;
  fingerprint: string | null;
  
  setSession: (session: TableSession, token: string) => void;
  setFingerprint: (fingerprint: string) => void;
  clearSession: () => void;
  isSessionValid: () => boolean;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      session: null,
      sessionToken: null,
      fingerprint: null,

      setSession: (session, token) => {
        set({
          session,
          sessionToken: token,
        });
      },

      setFingerprint: (fingerprint) => {
        set({ fingerprint });
      },

      clearSession: () => {
        set({
          session: null,
          sessionToken: null,
        });
      },

      isSessionValid: () => {
        const { session, sessionToken } = get();
        return !!session && !!sessionToken && session.isVerified;
      },
    }),
    {
      name: 'qrmenu-session',
    }
  )
);

