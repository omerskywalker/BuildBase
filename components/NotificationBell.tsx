"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, MessageSquare, Trophy, Info, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiFetchJson } from "@/lib/api-helpers";
import type { Notification, NotificationType } from "@/lib/types";

const POLL_INTERVAL = 30_000; // 30 seconds

function typeIcon(type: NotificationType) {
  switch (type) {
    case "coach_note":
      return <MessageSquare size={16} className="text-accent shrink-0" />;
    case "milestone":
      return <Trophy size={16} className="text-warning shrink-0" />;
    case "system":
      return <Info size={16} className="text-content-secondary shrink-0" />;
  }
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSeconds = Math.floor((now - then) / 1000);

  if (diffSeconds < 60) return "just now";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await apiFetchJson<Notification[]>("/api/notifications");
      setNotifications(data);
    } catch {
      // Silently fail on poll — user doesn't need to see this
    }
  }, []);

  // Fetch on mount and poll every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  async function markAllRead() {
    try {
      await apiFetchJson("/api/notifications", { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          read_at: n.read_at ?? new Date().toISOString(),
        })),
      );
    } catch {
      // Best-effort
    }
  }

  async function handleNotificationClick(notification: Notification) {
    // Mark as read
    if (!notification.read_at) {
      try {
        await apiFetchJson(`/api/notifications/${notification.id}`, {
          method: "PATCH",
        });
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id
              ? { ...n, read_at: new Date().toISOString() }
              : n,
          ),
        );
      } catch {
        // Best-effort
      }
    }

    // Navigate if link exists
    if (notification.link) {
      setOpen(false);
      router.push(notification.link);
    }
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-transparent border border-border-subtle text-content-secondary cursor-pointer transition-colors hover:border-border-strong hover:text-content-primary"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-error text-button-text text-[10px] font-bold leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-lg border border-border-subtle bg-bg-elevated shadow-lg z-50"
        >
          {/* Header */}
          <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-bg-elevated">
            <span className="text-sm font-semibold text-content-primary">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-accent hover:text-accent-dim transition-colors cursor-pointer"
              >
                <Check size={12} />
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4">
              <Bell size={24} className="text-content-muted mb-2" />
              <p className="text-sm text-content-muted">
                You&apos;re all caught up!
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left flex gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-bg-hover ${
                      !n.read_at ? "bg-bg-surface" : ""
                    }`}
                  >
                    <div className="mt-0.5">{typeIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm leading-tight ${
                          !n.read_at
                            ? "font-semibold text-content-primary"
                            : "text-content-secondary"
                        }`}
                      >
                        {n.title}
                      </p>
                      <p className="text-xs text-content-muted mt-0.5 truncate">
                        {n.message}
                      </p>
                      <p className="text-[11px] text-content-muted mt-1">
                        {relativeTime(n.created_at)}
                      </p>
                    </div>
                    {!n.read_at && (
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-accent shrink-0" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
