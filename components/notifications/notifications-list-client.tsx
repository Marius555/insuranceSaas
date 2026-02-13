"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { SearchAreaIcon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useNotifications } from "@/lib/context/notification-context";
import { getPaginatedNotifications, type NotificationFilter } from "@/appwrite/getPaginatedNotifications";
import { notificationTypeConfig, formatRelativeTime } from "@/components/notifications/notification-utils";
import type { NotificationDocument } from "@/lib/types/appwrite";

const ITEMS_PER_PAGE = 25;

const FILTER_TABS: { value: NotificationFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
];

interface NotificationsListClientProps {
  userId: string;
  initialNotifications: NotificationDocument[];
  initialTotal: number;
  initialUnreadCount: number;
}

export function NotificationsListClient({
  userId,
  initialNotifications,
  initialTotal,
  initialUnreadCount,
}: NotificationsListClientProps) {
  const router = useRouter();
  const { markRead, markAllRead } = useNotifications();

  const [notifications, setNotifications] = useState(initialNotifications);
  const [total, setTotal] = useState(initialTotal);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const highlightRef = useRef<HTMLButtonElement>(null);

  const fetchNotifications = useCallback(async (page: number, activeFilter: NotificationFilter) => {
    setLoading(true);
    const result = await getPaginatedNotifications(
      userId,
      ITEMS_PER_PAGE,
      (page - 1) * ITEMS_PER_PAGE,
      activeFilter,
    );
    if (result.success) {
      setNotifications(result.notifications);
      setTotal(result.total);
      setUnreadCount(result.unreadCount);
    }
    setLoading(false);
  }, [userId]);

  // Scroll-to-highlight on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash?.startsWith("#notification-")) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("notification-highlight");
      }
    }
  }, []);

  const handleFilterChange = (newFilter: NotificationFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
    setSearchQuery("");
    fetchNotifications(1, newFilter);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchNotifications(page, filter);
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    // Re-fetch current page to reflect changes
    await fetchNotifications(currentPage, filter);
  };

  const handleNotificationClick = async (notification: NotificationDocument) => {
    if (!notification.is_read) {
      await markRead(notification.$id);
      // Update local state optimistically
      setNotifications((prev) =>
        prev.map((n) => (n.$id === notification.$id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  // Client-side search filtering
  const filteredNotifications = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return notifications;
    return notifications.filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query)
    );
  }, [notifications, searchQuery]);

  const totalPages = searchQuery
    ? Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE)
    : Math.ceil(total / ITEMS_PER_PAGE);

  const displayedNotifications = searchQuery
    ? filteredNotifications
    : notifications;

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search + Filter tabs + Mark all as read */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <HugeiconsIcon
            icon={SearchAreaIcon}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
          />
          <Input
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleFilterChange(tab.value)}
              className={`inline-flex items-center justify-center min-w-[72px] px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === tab.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.value === "unread" && unreadCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            className="gap-1.5 shrink-0"
          >
            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Notification list */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Loading notifications...
        </div>
      ) : displayedNotifications.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          {searchQuery
            ? "No notifications match your search."
            : filter === "unread"
              ? "No unread notifications."
              : filter === "read"
                ? "No read notifications."
                : "No notifications yet."}
        </div>
      ) : (
        <div className="rounded-lg border divide-y">
          {displayedNotifications.map((notification) => {
            const config = notificationTypeConfig[notification.type];
            return (
              <button
                key={notification.$id}
                id={`notification-${notification.$id}`}
                ref={
                  typeof window !== "undefined" &&
                  window.location.hash === `#notification-${notification.$id}`
                    ? highlightRef
                    : undefined
                }
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex gap-3 items-start ${
                  !notification.is_read ? "bg-primary/[0.02]" : ""
                }`}
              >
                {/* Type icon */}
                <div
                  className={`mt-0.5 shrink-0 size-8 rounded-full flex items-center justify-center ${
                    config?.className ?? "bg-muted text-muted-foreground"
                  }`}
                >
                  <HugeiconsIcon
                    icon={config?.icon ?? InformationCircleIcon}
                    className="size-4"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p
                      className={`text-sm leading-tight truncate ${
                        !notification.is_read ? "font-semibold" : "font-normal"
                      }`}
                    >
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
            );
          })}
        </div>
      )}

      {/* Pagination - only show when not searching (search is client-side on current page) */}
      {!searchQuery && totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {getPageNumbers().map((page, i) =>
              page === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={currentPage === page}
                    onClick={() => handlePageChange(page)}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
