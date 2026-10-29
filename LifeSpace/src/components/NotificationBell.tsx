"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Icon, type IconName } from "@/components/ui";

const READ_KEY = "organizer-notifications-read";
const DISMISSED_KEY = "organizer-notifications-dismissed";
const EMPTY: string[] = [];

type Tone = "info" | "warn" | "ok";

export type AppNotification = {
  id: string;
  icon: IconName;
  tone: Tone;
  title: string;
  body: string;
  actionLabel?: string;
  /** What the action button opens. Defaults to Settings. */
  action?: "settings" | "feedback" | "owner" | "backup";
  dismissible: boolean;
};

function readIdList(key: string): string[] {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeIdList(key: string, ids: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

/** Tiny cached localStorage store so useSyncExternalStore sees stable snapshots. */
function createIdListStore(key: string) {
  let cache: string[] | null = null;
  const listeners = new Set<() => void>();
  return {
    get: (): string[] => {
      if (cache === null) cache = readIdList(key);
      return cache;
    },
    set: (ids: string[]) => {
      cache = ids;
      writeIdList(key, ids);
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

const readStore = createIdListStore(READ_KEY);
const dismissedStore = createIdListStore(DISMISSED_KEY);

const TONE_STYLES: Record<Tone, { dot: string; icon: string }> = {
  info: { dot: "bg-[#5a94e0]", icon: "bg-[#e8f1fc] text-[#2f6fb0]" },
  warn: { dot: "bg-[#d08a2a]", icon: "bg-[#fbf1de] text-[#9a6a14]" },
  ok: { dot: "bg-[#3b8a7b]", icon: "bg-[#e2f2ec] text-[#2a685d]" },
};

export function NotificationBell({
  onOpenAccount,
  onOpenFeedback,
  onOpenBackup,
  ownerUnread = null,
  onOpenOwnerInbox,
}: {
  onOpenAccount: () => void;
  onOpenFeedback: () => void;
  onOpenBackup: () => void;
  /** Number of unread feedback messages, only provided to the website owner. */
  ownerUnread?: number | null;
  onOpenOwnerInbox?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const readIds = useSyncExternalStore(readStore.subscribe, readStore.get, () => EMPTY);
  const dismissedIds = useSyncExternalStore(
    dismissedStore.subscribe,
    dismissedStore.get,
    () => EMPTY,
  );

  const notifications = useMemo<AppNotification[]>(
    () => [
      {
        id: "saved-locally",
        icon: "check",
        tone: "ok",
        title: "Your progress is saved automatically",
        body: "Every task, goal and checkmark is stored in this browser as you work — no account needed.",
        dismissible: true,
      },
      {
        id: "backup-progress",
        icon: "download",
        tone: "info",
        title: "Keep a backup of your progress",
        body: "Download a small backup file so your tasks and checkmarks are safe, even if this browser's data is cleared.",
        actionLabel: "Back up now",
        action: "backup",
        dismissible: true,
      },
      {
        id: "share-feedback",
        icon: "pencil",
        tone: "info",
        title: "Share your feedback",
        body: "Tell us what you like, what to add or what to remove. Every message is read.",
        actionLabel: "Send feedback",
        action: "feedback",
        dismissible: true,
      },
      {
        id: "tip-settings",
        icon: "settings",
        tone: "info",
        title: "Make it yours",
        body: "Open Settings to change your name, theme, colors, fonts, text size and background.",
        actionLabel: "Open Settings",
        dismissible: true,
      },
    ],
    [],
  );

  const ownerNotification: AppNotification | null =
    ownerUnread !== null && ownerUnread > 0
      ? {
          id: `owner-feedback-${ownerUnread}`,
          icon: "bell",
          tone: "warn",
          title: `${ownerUnread} new feedback message${ownerUnread > 1 ? "s" : ""}`,
          body: "Visitors sent you comments and suggestions. Open the inbox to read them.",
          actionLabel: "Open feedback inbox",
          action: "owner",
          dismissible: true,
        }
      : null;
  const allNotifications = ownerNotification ? [ownerNotification, ...notifications] : notifications;

  const visible = allNotifications.filter((notification) => !dismissedIds.includes(notification.id));
  const unreadCount = visible.filter((notification) => !readIds.includes(notification.id)).length;

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const toggle = () => {
    setOpen((current) => {
      const next = !current;
      if (next) {
        // Opening the panel marks everything as read.
        readStore.set([...new Set([...readIds, ...visible.map((notification) => notification.id)])]);
      }
      return next;
    });
  };

  const dismiss = (id: string) => {
    dismissedStore.set([...new Set([...dismissedIds, id])]);
  };

  const markAllRead = () => {
    readStore.set([...new Set([...readIds, ...visible.map((notification) => notification.id)])]);
  };

  return (
    <div ref={containerRef} className="no-print fixed right-3 top-3 z-[70] sm:right-4 sm:top-4">
      <button
        type="button"
        onClick={toggle}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={open}
        className={`relative inline-flex h-10 w-10 items-center justify-center border shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-sheet-teal/30 ${
          open
            ? "border-sheet-teal-dark bg-sheet-teal-dark text-white"
            : "border-sheet-teal-dark bg-sheet-teal text-white hover:bg-sheet-teal-dark"
        }`}
      >
        {/* Keyed by the unread count: a fresh notification replays the ring animation. */}
        <span key={unreadCount} className={unreadCount > 0 ? "bell-ring inline-flex" : "inline-flex"}>
          <Icon name="bell" className="h-4 w-4" />
        </span>
        {unreadCount > 0 ? (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#d0342c] px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Notifications"
          className="notification-panel absolute right-0 top-[46px] w-[min(92vw,340px)] overflow-hidden border border-[#c3d2d6] bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-[#dfe8ea] bg-[#fbfdfc] px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#22312e]">
              Notifications
            </span>
            <button
              type="button"
              onClick={markAllRead}
              className="text-[9px] font-bold uppercase tracking-[0.08em] text-sheet-teal-dark hover:underline"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {visible.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Icon name="bell" className="mx-auto h-5 w-5 text-[#b3c0bd]" />
                <p className="mt-2 text-[11px] font-semibold text-[#22312e]">
                  You&apos;re all caught up
                </p>
                <p className="mt-0.5 text-[9.5px] text-sheet-muted">
                  New tips and updates will appear here.
                </p>
              </div>
            ) : (
              visible.map((notification) => {
                const unread = !readIds.includes(notification.id);
                const tone = TONE_STYLES[notification.tone];
                return (
                  <div
                    key={notification.id}
                    className={`relative flex gap-2.5 border-b border-[#eef3f4] px-3 py-2.5 last:border-b-0 ${
                      unread ? "bg-[#f4faf8]" : "bg-white"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${tone.icon}`}
                    >
                      <Icon name={notification.icon} className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[11px] font-bold leading-snug text-[#22312e]">
                          {notification.title}
                        </p>
                        {notification.dismissible ? (
                          <button
                            type="button"
                            onClick={() => dismiss(notification.id)}
                            aria-label={`Dismiss "${notification.title}"`}
                            className="shrink-0 text-[#9aa9a5] transition-colors hover:text-[#5a6a66]"
                          >
                            <Icon name="close" className="h-3 w-3" />
                          </button>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[10px] leading-relaxed text-sheet-muted">
                        {notification.body}
                      </p>
                      {notification.actionLabel ? (
                        <button
                          type="button"
                          onClick={() => {
                            setOpen(false);
                            if (notification.action === "feedback") onOpenFeedback();
                            else if (notification.action === "backup") onOpenBackup();
                            else if (notification.action === "owner") onOpenOwnerInbox?.();
                            else onOpenAccount();
                          }}
                          className="mt-1.5 inline-flex items-center gap-1 border border-sheet-teal-dark bg-sheet-teal px-2 py-1 text-[9.5px] font-bold text-white transition-colors hover:bg-sheet-teal-dark"
                        >
                          {notification.actionLabel}
                          <Icon name="chevronRight" className="h-2.5 w-2.5" />
                        </button>
                      ) : null}
                    </div>
                    {unread ? (
                      <span
                        aria-hidden="true"
                        className={`absolute left-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full ${tone.dot}`}
                      />
                    ) : null}
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-[#dfe8ea] bg-[#f7faf9] px-3 py-1.5">
            <span className="min-w-0 text-[8.5px] leading-snug text-sheet-muted">
              Saved automatically on this device.
            </span>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenFeedback();
              }}
              className="inline-flex shrink-0 items-center gap-1 border border-[#c3d2d6] bg-white px-2 py-1 text-[9px] font-bold text-sheet-teal-dark transition-colors hover:border-sheet-teal"
            >
              <Icon name="pencil" className="h-2.5 w-2.5" />
              Send feedback
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
