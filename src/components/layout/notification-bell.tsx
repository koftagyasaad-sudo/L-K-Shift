"use client";

import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/utils";

export interface NotificationItem {
  id: string;
  title: string;
  message?: string;
  body?: string;
  content?: string;
  isRead?: boolean;
  read?: boolean;
  createdAt?: Date | string | null;
  link?: string;
  [key: string]: any;
}

export function NotificationBell({
  initialNotifications = [],
  locale = "ar",
}: {
  initialNotifications?: NotificationItem[];
  locale?: string;
}) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    initialNotifications
  );
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialNotifications && initialNotifications.length > 0) {
      setNotifications(initialNotifications);
    }
  }, [initialNotifications]);

  const unreadCount = notifications.filter(
    (n) => n.isRead === false || n.read === false
  ).length;

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, read: true }))
        );
        toast.success(
          locale === "ar" ? "تم تحديد الكل كمقروء" : "All marked as read"
        );
      }
    } catch (error) {
      console.error("Failed to mark notifications as read", error);
    } finally {
      setLoading(false);
    }
  };

  const markSingleAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, read: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark single notification as read", error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 ltr:right-0 rtl:left-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 text-sm">
              {locale === "ar" ? "التنبيهات" : "Notifications"}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={loading}
                className="text-xs text-blue-600 hover:underline disabled:opacity-50"
              >
                {locale === "ar" ? "تحديد الكل كمقروء" : "Mark all as read"}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">
                {locale === "ar" ? "لا توجد تنبيهات حالياً" : "No notifications yet"}
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = n.isRead === false || n.read === false;
                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (isUnread) markSingleAsRead(n.id);
                    }}
                    className={`p-3 text-sm hover:bg-gray-50 transition-colors cursor-pointer ${
                      isUnread ? "bg-blue-50/40" : ""
                    }`}
                  >
                    <div className="font-medium text-gray-800">{n.title}</div>
                    {(n.message || n.body || n.content) && (
                      <p className="text-gray-600 text-xs mt-0.5 line-clamp-2">
                        {n.message || n.body || n.content}
                      </p>
                    )}
                    {n.createdAt && (
                      <div className="text-[10px] text-gray-400 mt-1">
                        {formatDateTime(n.createdAt, locale)}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
