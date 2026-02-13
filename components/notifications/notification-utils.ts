import {
  CheckmarkCircle02Icon,
  ArrowReloadHorizontalIcon,
  SettingsIcon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import type { NotificationDocument } from "@/lib/types/appwrite";

export const notificationTypeConfig: Record<
  NotificationDocument["type"],
  { icon: typeof CheckmarkCircle02Icon; className: string }
> = {
  report_completed: { icon: CheckmarkCircle02Icon, className: "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400" },
  report_updated: { icon: ArrowReloadHorizontalIcon, className: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400" },
  system: { icon: SettingsIcon, className: "bg-muted text-muted-foreground" },
  info: { icon: InformationCircleIcon, className: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400" },
};

export function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
