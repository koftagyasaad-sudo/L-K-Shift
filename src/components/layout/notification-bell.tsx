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
        className="relative inline-flex items-center justify-center rounded-full border border-border bg-surface p-2.5 text-foreground transition hover:bg-background-secondary"
        aria-label={t("notifications")}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="bg-primary absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute end-0 top-14 z-50 w-[22rem] overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl shadow-black/10 dark:shadow-black/40">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{t("notifications")}</p>
              <p className="text-xs text-foreground-muted">{unreadCount} unread</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={enableAlerts}
                className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground-muted transition hover:bg-background-secondary hover:text-foreground"
              >
                {t("enableAlerts")}
              </button>
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground-muted transition hover:bg-background-secondary hover:text-foreground"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>{t("markAllRead")}</span>
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {!hydrated || notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-foreground-muted">{t("noNotifications")}</div>
            ) : (
              notifications.map((item) => (
                <Link
                  key={item.id}
                  href={item.link || "/"}
                  locale={locale}
                  className="block border-b border-border px-4 py-3 transition hover:bg-background-secondary last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1 h-2.5 w-2.5 rounded-full ${
                        item.isRead ? "bg-border-strong" : "bg-primary"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-foreground-muted">{item.message}</p>
                      <p className="mt-2 text-[11px] text-foreground-muted">{formatDateTime(item.createdAt, locale)}</p>
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
