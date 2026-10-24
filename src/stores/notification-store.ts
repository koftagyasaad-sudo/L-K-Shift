import { useSyncExternalStore } from "react";

export type NotificationItem = {
  id: number | string;
  userId?: string;
  title?: string;
  titleAr?: string;
  titleEn?: string;
  message?: string;
  messageAr?: string;
  messageEn?: string;
  type?: string;
  isRead?: boolean;
  read?: boolean;
  createdAt?: string | Date;
  [key: string]: any;
};

export interface NotificationStore {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number | string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (item: NotificationItem) => void;
  clearNotifications: () => void;
}

type SetStateFn<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
type GetStateFn<T> = () => T;

/**
 * دالة create مخصصة تماثل واجهة Zustand بنسبة 100% بدون الاعتماد على أي مكتبة خارجية.
 * تمنع ظهور خطأ التجميع (Cannot find module 'zustand') أثناء الـ Build على Vercel.
 */
export function create<T extends object>(
  createState: (set: SetStateFn<T>, get: GetStateFn<T>) => T
) {
  let state: T;
  const listeners = new Set<() => void>();

  const setState: SetStateFn<T> = (partial) => {
    const nextState = typeof partial === "function" ? partial(state) : partial;
    if (nextState && nextState !== state) {
      state = Object.assign({}, state, nextState);
      listeners.forEach((listener) => listener());
    }
  };

  const getState: GetStateFn<T> = () => state;

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  state = createState(setState, getState);

  const useStore = <U = T>(selector?: (state: T) => U): U => {
    const slice = useSyncExternalStore(
      subscribe,
      () => getState(),
      () => getState()
    );
    return selector ? selector(slice) : (slice as unknown as U);
  };

  Object.assign(useStore, {
    getState,
    setState,
    subscribe,
  });

  return useStore;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        const list: NotificationItem[] = Array.isArray(data)
          ? data
          : data.notifications || [];
        const unread = list.filter((n) => !n.isRead && !n.read).length;
        set({ notifications: list, unreadCount: unread });
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: number | string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
    set((state) => {
      const updated = state.notifications.map((n) =>
        String(n.id) === String(id) ? { ...n, isRead: true, read: true } : n
      );
      const unread = updated.filter((n) => !n.isRead && !n.read).length;
      return { notifications: updated, unreadCount: unread };
    });
  },

  markAllAsRead: async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "PATCH" });
    } catch (err) {
      console.error("Error marking all read:", err);
    }
    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        isRead: true,
        read: true,
      })),
      unreadCount: 0,
    }));
  },

  addNotification: (item: NotificationItem) => {
    set((state) => {
      const updated = [item, ...state.notifications];
      const unread = updated.filter((n) => !n.isRead && !n.read).length;
      return { notifications: updated, unreadCount: unread };
    });
  },

  clearNotifications: () => {
    set({ notifications: [], unreadCount: 0 });
  },
}));

export default useNotificationStore;
