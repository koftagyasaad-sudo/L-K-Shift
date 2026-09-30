import { create } from "zustand";

export type NotificationItem = {
  id: number;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

type NotificationState = {
  notifications: NotificationItem[];
  unreadCount: number;
  hydrated: boolean;
  hydrate: (notifications: NotificationItem[]) => void;
  markAllRead: () => void;
};

function countUnread(notifications: NotificationItem[]) {
  return notifications.filter((item) => !item.isRead).length;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  hydrated: false,
  hydrate: (notifications) =>
    set((state) =>
      state.hydrated
        ? state
        : {
            notifications,
            unreadCount: countUnread(notifications),
            hydrated: true,
          },
    ),
  markAllRead: () =>
    set((state) => {
      const notifications = state.notifications.map((item) => ({ ...item, isRead: true }));
      return {
        notifications,
        unreadCount: 0,
        hydrated: true,
      };
    }),
}));
