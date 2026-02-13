"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { getNotifications } from "@/appwrite/getNotifications";
import { markNotificationRead } from "@/appwrite/markNotificationRead";
import { markAllNotificationsRead } from "@/appwrite/markAllNotificationsRead";
import type { NotificationDocument } from "@/lib/types/appwrite";

interface NotificationContextData {
  userId: string;
  notifications: NotificationDocument[];
  unreadCount: number;
  markRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextData | null>(null);

interface NotificationProviderProps {
  children: ReactNode;
  userId: string;
  initialNotifications: NotificationDocument[];
  initialUnreadCount: number;
}

export function NotificationProvider({
  children,
  userId,
  initialNotifications,
  initialUnreadCount,
}: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<NotificationDocument[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  const refresh = useCallback(async () => {
    const result = await getNotifications(userId);
    if (result.success) {
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    }
  }, [userId]);

  // Poll every 30s
  useEffect(() => {
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  const markRead = useCallback(async (notificationId: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.$id === notificationId ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    const result = await markNotificationRead(notificationId);
    if (!result.success) {
      // Revert on failure
      await refresh();
    }
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    const result = await markAllNotificationsRead(userId);
    if (!result.success) {
      // Revert on failure
      await refresh();
    }
  }, [userId, refresh]);

  return (
    <NotificationContext.Provider value={{ userId, notifications, unreadCount, markRead, markAllRead, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextData {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
