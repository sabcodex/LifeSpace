"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/ui";

export type InboxItem = {
  id: number;
  name: string;
  email: string | null;
  category: string;
  rating: number | null;
  message: string;
  read: boolean;
  createdAt: string;
};

const LABELS: Record<string, string> = {
  idea: "Idea",
  add: "Add something",
  remove: "Remove something",
  bug: "Something's broken",
  other: "Other",
};

const FILTERS = ["all", "unread", "idea", "add", "remove", "bug", "other"] as const;
type Filter = (typeof FILTERS)[number];

export function FeedbackInbox({
  initialItems,
  adminKey,
}: {
  initialItems: InboxItem[];
  adminKey?: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState<string | null>(null);

  const unread = items.filter((item) => !item.read).length;
  const rated = items.filter((item) => item.rating !== null);
  const average = rated.length ? rated.reduce((sum, item) => sum + (item.rating ?? 0), 0) / rated.length : null;

  const shown = useMemo(
    () =>
      items.filter((item) =>
        filter === "all" ? true : filter === "unread" ? !item.read : item.category === filter,
      ),
    [items, filter],
  );

  const markRead = async (body: { ids?: number[]; all?: boolean }) => {
    setError(null);
    const response = await fetch(`/api/feedback${adminKey ? `?key=${encodeURIComponent(adminKey)}` : ""}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      setError("Could not update. Try again.");
      return;
    }
    setItems((current) =>
      current.map((item) => (body.all || body.ids?.includes(item.id) ? { ...item, read: true } : item)),
    );
  };

  return (
    <div className="space-y-3">
      <div className="sheet-card overflow-hidden">
        <div className="brand-gradient flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-white">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/75">Owner</p>
            <h1 className="text-[16px] font-bold leading-tight">Feedback inbox</h1>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 border border-white/40 px-3 py-1.5 text-[10.5px] font-semibold hover:bg-white/15"
          >
            <Icon name="chevronLeft" className="h-3 w-3" />
            Back to the sheet
          </Link>
        </div>
        <div className="grid grid-cols-3 divide-x divide-[#dfe8ea] text-center">
          <div className="py-2.5">
            <p className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-sheet-muted">Messages</p>
            <p className="num text-[16px] font-extrabold text-[#22312e]">{items.length}</p>
          </div>
          <div className="py-2.5">
            <p className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-sheet-muted">Unread</p>
            <p className="num text-[16px] font-extrabold text-sheet-teal-dark">{unread}</p>
          </div>
          <div className="py-2.5">
            <p className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-sheet-muted">Avg. rating</p>
            <p className="num text-[16px] font-extrabold text-[#22312e]">
              {average === null ? "—" : `${average.toFixed(1)} ★`}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={`border px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                filter === value
                  ? "border-sheet-teal-dark bg-sheet-teal text-white"
                  : "border-[#c3d2d6] bg-white text-[#41514d] hover:border-sheet-teal"
              }`}
            >
              {value === "all" ? "All" : value === "unread" ? `Unread (${unread})` : LABELS[value]}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={unread === 0}
          onClick={() => void markRead({ all: true })}
          className="border border-[#c3d2d6] bg-white px-2.5 py-1 text-[10px] font-bold text-sheet-teal-dark transition-colors hover:border-sheet-teal disabled:opacity-45"
        >
          Mark all as read
        </button>
      </div>

      {error ? (
        <p role="alert" className="border border-red-300 bg-red-50 px-3 py-2 text-[10.5px] font-semibold text-red-800">
          {error}
        </p>
      ) : null}

      {shown.length === 0 ? (
        <div className="sheet-card px-5 py-10 text-center">
          <p className="text-[12px] font-bold text-[#22312e]">No feedback here yet</p>
          <p className="mt-1 text-[10.5px] text-sheet-muted">
            Visitors can send comments from the notification bell on the sheet.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {shown.map((item) => (
            <li
              key={item.id}
              className={`sheet-card px-4 py-3 ${item.read ? "" : "border-l-4 border-l-[var(--color-sheet-teal)]"}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="border border-[#c3d2d6] bg-[#f4faf8] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-sheet-teal-dark">
                    {LABELS[item.category] ?? item.category}
                  </span>
                  {item.rating !== null ? (
                    <span className="text-[11px] text-[#e0a526]" aria-label={`${item.rating} out of 5`}>
                      {"★".repeat(item.rating)}
                      <span className="text-[#c3d2d6]">{"★".repeat(5 - item.rating)}</span>
                    </span>
                  ) : null}
                  {!item.read ? (
                    <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-sheet-teal-dark">New</span>
                  ) : null}
                </div>
                <time className="text-[9.5px] text-sheet-muted" dateTime={item.createdAt}>
                  {new Date(item.createdAt).toLocaleString()}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-[11.5px] leading-relaxed text-[#22312e]">
                {item.message}
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[9.5px] text-sheet-muted">
                <span>
                  {item.name || "Anonymous"}
                  {item.email ? (
                    <>
                      {" · "}
                      <a className="font-semibold text-sheet-teal-dark underline" href={`mailto:${item.email}`}>
                        {item.email}
                      </a>
                    </>
                  ) : null}
                </span>
                {!item.read ? (
                  <button
                    type="button"
                    onClick={() => void markRead({ ids: [item.id] })}
                    className="font-bold text-sheet-teal-dark hover:underline"
                  >
                    Mark as read
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
