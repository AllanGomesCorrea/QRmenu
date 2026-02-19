import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from './sessionStore';

describe('sessionStore', () => {
  beforeEach(() => {
    useSessionStore.setState({
      session: null,
      sessionToken: null,
      fingerprint: null,
    });
    localStorage.clear();
  });

  describe('setSession', () => {
    it('should set session and token', () => {
      const session = {
        id: 's1',
        customerName: 'João',
        customerPhone: '11999999999',
        isVerified: true,
        tableId: 't1',
        tableNumber: 1,
        restaurantId: 'r1',
        restaurantSlug: 'test',
        restaurantName: 'Test Restaurant',
      };

      useSessionStore.getState().setSession(session, 'sess_abc123');

      const state = useSessionStore.getState();
      expect(state.session?.customerName).toBe('João');
      expect(state.sessionToken).toBe('sess_abc123');
    });
  });

  describe('setFingerprint', () => {
    it('should set device fingerprint', () => {
      useSessionStore.getState().setFingerprint('fp-unique-hash');

      expect(useSessionStore.getState().fingerprint).toBe('fp-unique-hash');
    });
  });

  describe('clearSession', () => {
    it('should clear session and token but keep fingerprint', () => {
      useSessionStore.getState().setFingerprint('fp-123');
      useSessionStore.getState().setSession(
        {
          id: 's1',
          customerName: 'João',
          customerPhone: '11999999999',
          isVerified: true,
          tableId: 't1',
          tableNumber: 1,
          restaurantId: 'r1',
          restaurantSlug: 'test',
          restaurantName: 'Test',
        },
        'token-123',
      );

      useSessionStore.getState().clearSession();

      const state = useSessionStore.getState();
      expect(state.session).toBeNull();
      expect(state.sessionToken).toBeNull();
      expect(state.fingerprint).toBe('fp-123'); // Fingerprint preserved
    });
  });

  describe('isSessionValid', () => {
    it('should return false when no session', () => {
      expect(useSessionStore.getState().isSessionValid()).toBe(false);
    });

    it('should return false when no token', () => {
      useSessionStore.setState({
        session: {
          id: 's1',
          customerName: 'João',
          customerPhone: '999',
          isVerified: true,
          tableId: 't1',
          tableNumber: 1,
          restaurantId: 'r1',
          restaurantSlug: 'test',
          restaurantName: 'Test',
        },
        sessionToken: null,
      });

      expect(useSessionStore.getState().isSessionValid()).toBe(false);
    });

    it('should return false when session is not verified', () => {
      useSessionStore.setState({
        session: {
          id: 's1',
          customerName: 'João',
          customerPhone: '999',
          isVerified: false, // Not verified
          tableId: 't1',
          tableNumber: 1,
          restaurantId: 'r1',
          restaurantSlug: 'test',
          restaurantName: 'Test',
        },
        sessionToken: 'token-123',
      });

      expect(useSessionStore.getState().isSessionValid()).toBe(false);
    });

    it('should return true for valid verified session with token', () => {
      useSessionStore.getState().setSession(
        {
          id: 's1',
          customerName: 'João',
          customerPhone: '999',
          isVerified: true,
          tableId: 't1',
          tableNumber: 1,
          restaurantId: 'r1',
          restaurantSlug: 'test',
          restaurantName: 'Test',
        },
        'valid-token',
      );

      expect(useSessionStore.getState().isSessionValid()).toBe(true);
    });
  });
});
