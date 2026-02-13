"use client";

import { useNotifications } from "@/lib/context/notification-context";
import { useMounted } from "@/hooks/use-mounted";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Notification01Icon } from "@hugeicons/core-free-icons";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { notificationTypeConfig, formatRelativeTime } from "@/components/notifications/notification-utils";

export function NotificationBell() {
  const mounted = useMounted();
  const { userId, notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const router = useRouter();

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    if (!notification.is_read) {
      await markRead(notification.$id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="relative">
        <HugeiconsIcon icon={Notification01Icon} className="size-5" />
        <span className="sr-only">Notifications</span>
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <HugeiconsIcon icon={Notification01Icon} className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 gap-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead()}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Notification list */}
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.$id}
                  onClick={() => handleNotificationClick(notification)}
                  className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex gap-3 items-start"
                >
                  {/* Type icon */}
                  <div className={`mt-0.5 shrink-0 size-8 rounded-full flex items-center justify-center ${notificationTypeConfig[notification.type]?.className ?? "bg-muted text-muted-foreground"}`}>
                    <HugeiconsIcon
                      icon={notificationTypeConfig[notification.type]?.icon ?? InformationCircleIcon}
                      className="size-4"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-sm leading-tight truncate ${!notification.is_read ? "font-semibold" : "font-normal"}`}>
                        {notification.title}
                      </p>
                      {!notification.is_read && (
                        <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded-full">
                          New
                        </span>
                      )}
                      <span className="shrink-0 ml-auto text-[11px] text-muted-foreground">
                        {formatRelativeTime(notification.$createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* View all link */}
        <div className="border-t px-4 py-2.5">
          <Link
            href={`/auth/dashboard/${userId}/notifications`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium flex items-center justify-center"
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
