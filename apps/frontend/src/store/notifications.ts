import { create } from 'zustand';
import { Notification } from '@/types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  unreadMessageCount: number;
  followRequestCount: number;
  
  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  setUnreadCount: (count: number) => void;
  incrementUnreadMessages: () => void;
  resetUnreadMessages: () => void;
  setUnreadMessageCount: (count: number) => void;
  setFollowRequestCount: (count: number) => void;
  incrementFollowRequests: () => void;
  decrementFollowRequests: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  unreadMessageCount: 0,
  followRequestCount: 0,

  setNotifications: (notifications) => {
    set({ notifications });
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  setUnreadCount: (count) => {
    set({ unreadCount: count });
  },

  incrementUnreadMessages: () => {
    set((state) => ({ unreadMessageCount: state.unreadMessageCount + 1 }));
  },

  resetUnreadMessages: () => {
    set({ unreadMessageCount: 0 });
  },

  setUnreadMessageCount: (count) => {
    set({ unreadMessageCount: count });
  },

  setFollowRequestCount: (count) => {
    set({ followRequestCount: count });
  },

  incrementFollowRequests: () => {
    set((state) => ({ followRequestCount: state.followRequestCount + 1 }));
  },

  decrementFollowRequests: () => {
    set((state) => ({ followRequestCount: Math.max(0, state.followRequestCount - 1) }));
  },
}));
