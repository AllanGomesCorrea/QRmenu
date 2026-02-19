import { describe, it, expect, beforeEach } from 'vitest';
import { useNotificationStore } from './notificationStore';

describe('notificationStore', () => {
  beforeEach(() => {
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
    });
    localStorage.clear();
  });

  describe('addNotification', () => {
    it('should add a notification with generated id and timestamp', () => {
      useNotificationStore.getState().addNotification({
        type: 'order',
        title: 'Novo Pedido',
        message: 'Pedido #001 recebido',
        tableNumber: 1,
      });

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0].type).toBe('order');
      expect(state.notifications[0].title).toBe('Novo Pedido');
      expect(state.notifications[0].read).toBe(false);
      expect(state.notifications[0].id).toBeDefined();
      expect(state.notifications[0].timestamp).toBeDefined();
      expect(state.unreadCount).toBe(1);
    });

    it('should prepend new notifications (most recent first)', () => {
      const store = useNotificationStore.getState();
      store.addNotification({ type: 'order', title: 'First', message: '' });
      store.addNotification({ type: 'waiter', title: 'Second', message: '' });

      const notifications = useNotificationStore.getState().notifications;
      expect(notifications[0].title).toBe('Second');
      expect(notifications[1].title).toBe('First');
    });

    it('should keep max 50 notifications', () => {
      const store = useNotificationStore.getState();
      for (let i = 0; i < 60; i++) {
        store.addNotification({ type: 'info', title: `Notif ${i}`, message: '' });
      }

      expect(useNotificationStore.getState().notifications).toHaveLength(50);
    });

    it('should increment unread count', () => {
      const store = useNotificationStore.getState();
      store.addNotification({ type: 'order', title: 'A', message: '' });
      store.addNotification({ type: 'waiter', title: 'B', message: '' });
      store.addNotification({ type: 'bill', title: 'C', message: '' });

      expect(useNotificationStore.getState().unreadCount).toBe(3);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', () => {
      const store = useNotificationStore.getState();
      store.addNotification({ type: 'order', title: 'Test', message: '' });

      const notifId = useNotificationStore.getState().notifications[0].id;
      store.markAsRead(notifId);

      const state = useNotificationStore.getState();
      expect(state.notifications[0].read).toBe(true);
      expect(state.unreadCount).toBe(0);
    });

    it('should not decrement unread count when already read', () => {
      const store = useNotificationStore.getState();
      store.addNotification({ type: 'order', title: 'Test', message: '' });

      const notifId = useNotificationStore.getState().notifications[0].id;
      store.markAsRead(notifId);
      store.markAsRead(notifId); // Mark again

      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read and reset unread count', () => {
      const store = useNotificationStore.getState();
      store.addNotification({ type: 'order', title: 'A', message: '' });
      store.addNotification({ type: 'waiter', title: 'B', message: '' });

      store.markAllAsRead();

      const state = useNotificationStore.getState();
      expect(state.unreadCount).toBe(0);
      expect(state.notifications.every((n) => n.read)).toBe(true);
    });
  });

  describe('removeNotification', () => {
    it('should remove notification and update unread count', () => {
      const store = useNotificationStore.getState();
      store.addNotification({ type: 'order', title: 'A', message: '' });
      store.addNotification({ type: 'waiter', title: 'B', message: '' });

      const notifId = useNotificationStore.getState().notifications[0].id;
      store.removeNotification(notifId);

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(1);
      expect(state.unreadCount).toBe(1); // B is still unread
    });

    it('should not decrement unread count when removing read notification', () => {
      const store = useNotificationStore.getState();
      store.addNotification({ type: 'order', title: 'A', message: '' });

      const notifId = useNotificationStore.getState().notifications[0].id;
      store.markAsRead(notifId);
      store.removeNotification(notifId);

      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });
  });

  describe('clearAll', () => {
    it('should clear all notifications and reset unread count', () => {
      const store = useNotificationStore.getState();
      store.addNotification({ type: 'order', title: 'A', message: '' });
      store.addNotification({ type: 'waiter', title: 'B', message: '' });

      store.clearAll();

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(0);
      expect(state.unreadCount).toBe(0);
    });
  });
});
