"use client";

import { Bell, CheckCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { formatDateTime } from "@/lib/utils";
import { type NotificationItem, useNotificationStore } from "@/stores/notification-store";

export function NotificationBell({ initialNotifications }: { initialNotifications: NotificationItem[] }) {
  const locale = useLocale();
  const t = useTranslations("header");
  const [open, setOpen] = useState(false);
  const hydrated = useNotificationStore((state) => state.hydrated);
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const hydrate = useNotificationStore((state) => state.hydrate);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const shownIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    hydrate(initialNotifications);
  }, [hydrate, initialNotifications]);

  const latestUnread = useMemo(
    () => notifications.find((item) => !item.isRead && !shownIds.current.has(item.id)),
    [notifications],
  );

  useEffect(() => {
    if (typeof window === "undefined" || !latestUnread) {
      return;
    }

    if (window.Notification?.permission === "granted") {
      new window.Notification(latestUnread.title, { body: latestUnread.message });
      shownIds.current.add(latestUnread.id);
    }
  }, [latestUnread]);

  async function handleMarkAllRead() {
    const response = await fetch("/api/notifications/mark-all-read", { method: "POST" });

    if (!response.ok) {
      toast.error("Unable to update notifications");
      return;
    }

    markAllRead();
    toast.success(t("markAllRead"));
  }

  async function enableAlerts() {
    if (typeof window === "undefined" || !window.Notification) {
      toast.error("Notifications are not supported in this browser.");
      return;
    }

    const permission = await window.Notification.requestPermission();

    if (permission === "granted") {
      toast.success(t("browserAlerts"));
      return;
    }

    toast.error("Notification permission denied.");
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 p-2.5 text-white transition hover:bg-white/15"
        aria-label={t("notifications")}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#D8261C] px-1 text-[11px] font-bold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute end-0 top-14 z-50 w-[22rem] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 dark:border-white/10 dark:bg-[#171717] dark:shadow-black/40">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-white/10">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{t("notifications")}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{unreadCount} unread</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={enableAlerts}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
              >
                {t("enableAlerts")}
              </button>
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>{t("markAllRead")}</span>
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {!hydrated || notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">{t("noNotifications")}</div>
            ) : (
              notifications.map((item) => (
                <Link
                  key={item.id}
                  href={item.link || "/"}
                  locale={locale}
                  className="block border-b border-slate-100 px-4 py-3 transition hover:bg-slate-50 last:border-b-0 dark:border-white/5 dark:hover:bg-white/5"
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-1 h-2.5 w-2.5 rounded-full ${item.isRead ? "bg-slate-300 dark:bg-slate-600" : "bg-[#D8261C]"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.message}</p>
                      <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">{formatDateTime(item.createdAt, locale)}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
