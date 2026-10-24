"use client";

import { useSyncExternalStore } from "react";

export type SidebarState = {
  isOpen: boolean;
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggle: () => void;
  toggleMobile: () => void;
  setOpen: (open: boolean) => void;
  setCollapsed: (collapsed: boolean) => void;
  collapse: () => void;
  expand: () => void;
  [key: string]: any;
};

const STORAGE_KEY = "lk_sidebar_state_v1";

function getInitialState(): { isOpen: boolean; isCollapsed: boolean; isMobileOpen: boolean } {
  if (typeof window === "undefined") {
    return { isOpen: true, isCollapsed: false, isMobileOpen: false };
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        isOpen: typeof parsed.isOpen === "boolean" ? parsed.isOpen : true,
        isCollapsed: typeof parsed.isCollapsed === "boolean" ? parsed.isCollapsed : false,
        isMobileOpen: false,
      };
    }
  } catch (err) {
    console.error("Error reading sidebar state from localStorage:", err);
  }
  return { isOpen: true, isCollapsed: false, isMobileOpen: false };
}

type SetStateFn<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
type GetStateFn<T> = () => T;

/**
 * دالة create مخصصة تعمل بدواخل React القياسية لتعويض Zustand وميزات Persist تماماً.
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
      
      // حفظ الحالة في localStorage تلقائياً
      if (typeof window !== "undefined") {
        try {
          const toSave = {
            isOpen: (state as any).isOpen,
            isCollapsed: (state as any).isCollapsed,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        } catch (e) {
          // ignore storage errors
        }
      }

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

const initialVals = getInitialState();

export const useSidebarStore = create<SidebarState>((set, get) => ({
  isOpen: initialVals.isOpen,
  isCollapsed: initialVals.isCollapsed,
  isMobileOpen: initialVals.isMobileOpen,

  toggle: () => {
    const current = get().isCollapsed;
    set({ isCollapsed: !current, isOpen: current });
  },

  toggleMobile: () => {
    set({ isMobileOpen: !get().isMobileOpen });
  },

  setOpen: (open: boolean) => {
    set({ isOpen: open, isCollapsed: !open });
  },

  setCollapsed: (collapsed: boolean) => {
    set({ isCollapsed: collapsed, isOpen: !collapsed });
  },

  collapse: () => {
    set({ isCollapsed: true, isOpen: false });
  },

  expand: () => {
    set({ isCollapsed: false, isOpen: true });
  },
}));

export default useSidebarStore;
