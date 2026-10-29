"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarSettingsCard,
  DailyProgressCard,
  DonutCard,
  OrganizerCard,
} from "@/components/HeaderCards";
import { WeeklyOverview } from "@/components/OverviewCards";
import { TasksSheet } from "@/components/TasksSheet";
import { TaskEditor, type EditorState } from "@/components/TaskEditor";
import { Logo } from "@/components/Logo";
import { SpaceBanner } from "@/components/SpaceBanner";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { NotificationBell } from "@/components/NotificationBell";
import { SideMenu } from "@/components/SideMenu";
import { SettingsPage } from "@/components/SettingsPage";
import { buildMonth, clampInt, toDateStr, todayParts } from "@/lib/dates";
import { normalizeDisplayName, setGuestDisplayName, useGuestDisplayName } from "@/lib/display-name";
import {
  clearGuestSheet,
  collectGuestSheet,
  PENDING_MIGRATION_KEY,
  readGuestSheet,
} from "@/lib/guest-storage";
import { createSheetSource, flushPendingSaves, type SheetSource } from "@/lib/sheet-source";
import { completionKey, computeSheet, type TaskRecord } from "@/lib/stats";

export type DashboardInitial = {
  year: number;
  month: number;
  /** Null for guests: their sheet is read from this browser after mount. */
  tasks: TaskRecord[] | null;
  done: string[];
};

type Entry = { taskId: number; date: string; completed: boolean };
type Notice = { tone: "ok" | "error"; message: string };

export type DashboardUser = {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  provider: string;
};

type SettingsSection = "account" | "space" | "backup" | "theme" | "custom";

const OFFLINE_MESSAGE = "You're offline — your changes are kept on this device and will sync automatically.";

export function Dashboard({
  initial,
  today,
  user,
  ownerUnread = null,
}: {
  /** The month to show. Signed-in users also get its tasks pre-loaded by the server. */
  initial: DashboardInitial;
  today: string;
  user: DashboardUser | null;
  /** Unread feedback count; only set for the website owner. */
  ownerUnread?: number | null;
}) {
  const router = useRouter();
  const guestName = useGuestDisplayName();
  const [accountName, setAccountName] = useState(user?.name ?? "");
  const displayName = user ? accountName || user.email.split("@")[0] : guestName;
  const currentUser = user ? { ...user, name: accountName || user.name } : null;
  const [signingOut, setSigningOut] = useState(false);
  const [settingsSection, setSettingsSection] = useState<SettingsSection | null>(null);

  const handleSaveName = useCallback(async (name: string) => {
    const cleanName = normalizeDisplayName(name);
    if (!cleanName) throw new Error("Enter a name for your space.");
    if (!user) {
      setGuestDisplayName(cleanName);
      return;
    }
    const response = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: cleanName }),
    });
    const result = (await response.json()) as { ok?: boolean; name?: string; error?: string };
    if (!response.ok || !result.ok || !result.name) {
      throw new Error(result.error ?? "Could not save your name. Try again.");
    }
    setAccountName(result.name);
  }, [user]);

  const year = initial.year;
  const monthNumber = initial.month;

  const source: SheetSource = useMemo(
    () => createSheetSource(user ? user.id : null, year, monthNumber),
    [user, year, monthNumber],
  );

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Even if the request fails, return to the guest sheet.
    }
    window.location.href = "/";
  }, []);

  const [isNavigating, startTransition] = useTransition();
  const [taskList, setTaskList] = useState<TaskRecord[]>(initial.tasks ?? []);
  const [done, setDone] = useState<Set<string>>(() => new Set(initial.done));
  const [pending, setPending] = useState<Set<string>>(() => new Set());
  const [editor, setEditor] = useState<EditorState>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const month = useMemo(() => buildMonth(year, monthNumber), [year, monthNumber]);
  const searchParams = useSearchParams();
  const selectedDay = clampInt(
    searchParams.get("day"),
    1,
    month.daysInMonth,
    Math.min(Number(today.slice(8, 10)) || 1, month.daysInMonth),
  );
  const selectedDate = toDateStr(month.year, month.month, selectedDay);

  const stats = useMemo(
    () => computeSheet(month, taskList, done, today),
    [month, taskList, done, today],
  );

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // Guests: the sheet lives in localStorage, so load it client-side on mount.
  const guestLoadedRef = useRef(false);
  useEffect(() => {
    if (initial.tasks !== null || guestLoadedRef.current) return;
    guestLoadedRef.current = true;
    let cancelled = false;
    source
      .loadMonth()
      .then((data) => {
        if (cancelled) return;
        setTaskList(data.tasks);
        setDone(new Set(data.done));
      })
      .catch(() => {
        // The sheet simply stays empty until the next interaction.
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  // After sign-in, move any guest progress into the fresh account.
  const migratedRef = useRef(false);
  useEffect(() => {
    if (!user || migratedRef.current) return;
    let pendingFlag = false;
    try {
      pendingFlag = window.localStorage.getItem(PENDING_MIGRATION_KEY) === "1";
    } catch {
      pendingFlag = false;
    }
    if (!pendingFlag) return;
    migratedRef.current = true;

    const guest = collectGuestSheet();
    if (!guest) {
      try {
        window.localStorage.removeItem(PENDING_MIGRATION_KEY);
      } catch {
        // ignore
      }
      return;
    }

    void (async () => {
      try {
        const response = await fetch("/api/auth/migrate-guest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guest }),
        });
        if (!response.ok) return;
        try {
          window.localStorage.removeItem(PENDING_MIGRATION_KEY);
        } catch {
          // ignore
        }
        clearGuestSheet();
        setNotice({
          tone: "ok",
          message: "Your guest progress was moved into your account.",
        });
        await refreshAll();
      } catch {
        // The flag stays set, so the next visit retries the migration.
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const openSettings = useCallback((section?: SettingsSection) => {
    setSettingsSection(section ?? null);
    setSettingsOpen(true);
  }, []);

  const goToMonth = useCallback(
    (targetYear: number, targetMonth: number) => {
      const target = buildMonth(targetYear, targetMonth);
      const day = Math.min(selectedDay, target.daysInMonth);
      startTransition(() => {
        router.push(`/?year=${target.year}&month=${target.month}&day=${day}`, { scroll: false });
      });
    },
    [router, selectedDay],
  );

  const handleSelectDay = useCallback(
    (day: number) => {
      if (!Number.isInteger(day) || day < 1 || day > month.daysInMonth) return;
      // Native history integrates with useSearchParams without reloading this month's data.
      // The selected date survives a reload, while tasks and check-ins remain unchanged.
      const url = new URL(window.location.href);
      url.searchParams.set("year", String(month.year));
      url.searchParams.set("month", String(month.month));
      url.searchParams.set("day", String(day));
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    },
    [month.year, month.month, month.daysInMonth],
  );

  const handleToday = useCallback(() => {
    const target = todayParts();
    if (target.year === month.year && target.month === month.month) {
      handleSelectDay(target.day);
      return;
    }
    startTransition(() => {
      router.push(`/?year=${target.year}&month=${target.month}&day=${target.day}`, { scroll: false });
    });
  }, [router, month.year, month.month, handleSelectDay]);

  const refreshAll = useCallback(async () => {
    try {
      const data = await source.loadMonth();
      setTaskList(data.tasks);
      setDone(new Set(data.done));
    } catch {
      // Silent: the optimistic state stays usable, a later reload re-syncs.
    }
  }, [source]);

  // Signed-in users: sync changes kept on this device whenever the connection returns.
  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    const sync = async () => {
      const synced = await flushPendingSaves(userId);
      if (synced > 0) {
        setNotice({ tone: "ok", message: "Back online — your saved changes were synced." });
        await refreshAll();
      }
    };
    void sync();
    window.addEventListener("online", sync);
    return () => window.removeEventListener("online", sync);
  }, [user, refreshAll]);

  // Guests: ask the browser to keep this site's storage, so it isn't cleared automatically.
  useEffect(() => {
    if (user) return;
    void navigator.storage?.persist?.().catch(() => undefined);
  }, [user]);

  const applyEntries = useCallback(
    async (entries: Entry[], successMessage?: string) => {
      if (entries.length === 0) return;
      setDone((previous) => {
        const next = new Set(previous);
        for (const entry of entries) {
          const key = completionKey(entry.taskId, entry.date);
          if (entry.completed) next.add(key);
          else next.delete(key);
        }
        return next;
      });

      try {
        const queued = await source.applyCompletions(entries);
        if (queued) setNotice({ tone: "ok", message: OFFLINE_MESSAGE });
        else if (successMessage) setNotice({ tone: "ok", message: successMessage });
      } catch {
        setNotice({ tone: "error", message: "Could not save those check-ins — restoring." });
        await refreshAll();
      }
    },
    [refreshAll, source],
  );

  const toggleCompletion = useCallback(
    (taskId: number, date: string, completed: boolean) => {
      const key = completionKey(taskId, date);
      setDone((previous) => {
        const next = new Set(previous);
        if (completed) next.add(key);
        else next.delete(key);
        return next;
      });
      setPending((previous) => new Set(previous).add(key));

      void (async () => {
        try {
          const queued = await source.applyCompletions([{ taskId, date, completed }]);
          if (queued) setNotice({ tone: "ok", message: OFFLINE_MESSAGE });
        } catch {
          setDone((previous) => {
            const next = new Set(previous);
            if (completed) next.delete(key);
            else next.add(key);
            return next;
          });
          setNotice({ tone: "error", message: "That checkbox could not be saved. Try again." });
        } finally {
          setPending((previous) => {
            const next = new Set(previous);
            next.delete(key);
            return next;
          });
        }
      })();
    },
    [source],
  );

  const markAllToday = useCallback(() => {
    const entries = taskList.map((task) => ({ taskId: task.id, date: today, completed: true }));
    void applyEntries(entries, `All tasks checked for ${today}.`);
  }, [applyEntries, taskList, today]);

  const clearMonth = useCallback(() => {
    const entries: Entry[] = [];
    for (const task of taskList) {
      for (const day of month.days) {
        if (done.has(completionKey(task.id, day.date))) {
          entries.push({ taskId: task.id, date: day.date, completed: false });
        }
      }
    }
    if (entries.length === 0) {
      setNotice({ tone: "ok", message: "There are no checked boxes in this month." });
      return;
    }
    if (!window.confirm(`Clear all ${entries.length} checked boxes for ${month.monthLabel} ${month.year}?`)) {
      return;
    }
    void applyEntries(entries, `Cleared ${entries.length} check-ins.`);
  }, [applyEntries, done, month.days, month.monthLabel, month.year, taskList]);

  const createTask = useCallback(
    async (name: string, goal: number): Promise<boolean> => {
      setBusy(true);
      try {
        const task = await source.createTask(name, goal);
        setTaskList((previous) => [...previous, task]);
        setNotice({ tone: "ok", message: `“${name.trim()}” was added to the sheet.` });
        return true;
      } catch (error) {
        setNotice({
          tone: "error",
          message: error instanceof Error ? error.message : "Unable to create the task.",
        });
        return false;
      } finally {
        setBusy(false);
      }
    },
    [source],
  );

  const updateTask = useCallback(
    async (id: number, patch: { name?: string; goal?: number }): Promise<boolean> => {
      setBusy(true);
      try {
        const task = await source.updateTask(id, patch);
        if (!task) throw new Error("Task not found.");
        setTaskList((previous) => previous.map((item) => (item.id === id ? task : item)));
        setNotice({ tone: "ok", message: "Task updated." });
        return true;
      } catch (error) {
        setNotice({
          tone: "error",
          message: error instanceof Error ? error.message : "Unable to save the task.",
        });
        return false;
      } finally {
        setBusy(false);
      }
    },
    [source],
  );

  const deleteTask = useCallback(
    async (id: number): Promise<boolean> => {
      setBusy(true);
      try {
        await source.deleteTask(id);
        setTaskList((previous) => previous.filter((task) => task.id !== id));
        setDone((previous) => {
          const next = new Set(previous);
          for (const key of [...next]) {
            if (key.startsWith(`${id}|`)) next.delete(key);
          }
          return next;
        });
        setNotice({ tone: "ok", message: "Task deleted." });
        return true;
      } catch (error) {
        setNotice({
          tone: "error",
          message: error instanceof Error ? error.message : "Unable to delete the task.",
        });
        return false;
      } finally {
        setBusy(false);
      }
    },
    [source],
  );

  const moveTask = useCallback(
    async (id: number, direction: "up" | "down"): Promise<boolean> => {
      const ordered = [...taskList].sort((a, b) => a.position - b.position || a.id - b.id);
      const index = ordered.findIndex((task) => task.id === id);
      const neighbourIndex = direction === "up" ? index - 1 : index + 1;
      if (index < 0 || neighbourIndex < 0 || neighbourIndex >= ordered.length) return false;

      const current = ordered[index];
      const neighbour = ordered[neighbourIndex];
      const newCurrentPosition = neighbourIndex + 1;
      const newNeighbourPosition = index + 1;

      setTaskList((previous) =>
        previous
          .map((task) => {
            if (task.id === current.id) return { ...task, position: newCurrentPosition };
            if (task.id === neighbour.id) return { ...task, position: newNeighbourPosition };
            return task;
          })
          .sort((a, b) => a.position - b.position || a.id - b.id),
      );

      try {
        await Promise.all([
          source.updateTask(current.id, { position: newCurrentPosition }),
          source.updateTask(neighbour.id, { position: newNeighbourPosition }),
        ]);
        return true;
      } catch {
        setNotice({ tone: "error", message: "Unable to reorder rows." });
        await refreshAll();
        return false;
      }
    },
    [refreshAll, source, taskList],
  );

  const todayInMonth = month.days.some((day) => day.date === today);
  const isSaving = pending.size > 0 || busy;
  const isGuest = !user;

  // Read after mount only: localStorage doesn't exist during SSR.
  const [guestHasData, setGuestHasData] = useState(false);
  useEffect(() => {
    if (!isGuest) return;
    setGuestHasData(readGuestSheet() !== null);
  }, [isGuest]);

  return (
    <div className="pb-10">
      <SideMenu
        open={menuOpen}
        user={currentUser}
        guestName={guestName}
        signingOut={signingOut}
        onSignOut={() => void handleSignOut()}
        onToggle={() => setMenuOpen((current) => !current)}
        onClose={() => setMenuOpen(false)}
        onOpenSettings={openSettings}
      />

      <NotificationBell
        isGuest={isGuest}
        userEmail={user?.email}
        hasActivity={guestHasData && done.size > 0}
        onOpenAccount={() => openSettings("account")}
        onOpenFeedback={() => setFeedbackOpen(true)}
        onOpenBackup={() => openSettings("backup")}
        ownerUnread={ownerUnread}
      />

      <FeedbackDialog
        open={feedbackOpen}
        signedIn={Boolean(user)}
        onClose={() => setFeedbackOpen(false)}
      />

      <SettingsPage
        key={settingsOpen ? settingsSection ?? "menu" : "closed"}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        user={currentUser}
        displayName={displayName}
        onSaveName={handleSaveName}
        initialSection={settingsSection ?? undefined}
      />

      <header className="no-print mb-3 flex flex-wrap items-end justify-between gap-3 pl-12 pr-12 sm:pl-14 sm:pr-14">
        <div className="flex items-center gap-3">
          <Logo markClassName="h-12 w-12" />
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-sheet-teal-dark">
              {isGuest ? "Guest mode" : "My LifeSpace"}
            </p>
            <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-sheet-muted">
              {isGuest
                ? "Everything works right away. Sign in from Settings to save this sheet to an account."
                : "Monthly goals, a Monday-first 31-day grid, weekly progress and a daily completion chart — saved to your account."}
            </p>
          </div>
        </div>
        {isSaving ? (
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sheet-teal-dark">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sheet-teal" />
              Saving…
            </span>
          </div>
        ) : null}
      </header>

      {/* Calendar Settings and Today, beside each user's personalized space. */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[248px_minmax(0,1fr)]">
        <div className="mx-auto grid h-[248px] w-[248px] max-w-full grid-rows-2 gap-3 md:mx-0">
          <CalendarSettingsCard
            year={month.year}
            month={month.month}
            onMonthChange={goToMonth}
          />
          <OrganizerCard
            month={month}
            selectedDate={selectedDate}
            today={today}
            onSelectDay={handleSelectDay}
            onToday={handleToday}
            disabled={isNavigating}
          />
        </div>
        <SpaceBanner displayName={displayName} onCustomize={() => openSettings("space")} />
      </div>

      {/* Full-width Daily Progress chart. */}
      <div id="calendar" className="mt-3 min-w-0 scroll-mt-4">
        <DailyProgressCard
          stats={stats}
          monthLabel={month.monthLabel}
          year={month.year}
          today={today}
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3">
        {/* Overview Daily Progress sits directly on top of the Task log. */}
        <div className="min-w-0">
          <DonutCard stats={stats} monthLabel={month.monthLabel} />
        </div>
        <div id="tasks" className="min-w-0 scroll-mt-4">
          <TasksSheet
            month={month}
            stats={stats}
            done={done}
            today={today}
            selectedDate={selectedDate}
            pending={pending}
            onToggle={toggleCompletion}
            onEdit={(task) => setEditor({ mode: "edit", task })}
            onAdd={() => setEditor({ mode: "new" })}
            onCheckAllToday={markAllToday}
            onClearMonth={clearMonth}
            checkAllDisabled={!todayInMonth || taskList.length === 0}
          />
        </div>
      </div>

      {/* Calendar overview sits directly under the Task log. */}
      <div id="calendar-overview" className="mt-3 min-w-0 scroll-mt-4">
        <WeeklyOverview stats={stats} today={today} monthLabel={month.monthLabel} />
      </div>

      <details id="guide" className="sheet-card no-print group mt-3 scroll-mt-4 px-3 py-2 text-[10.5px] text-sheet-muted">
        <summary className="cursor-pointer list-none text-[10px] font-bold uppercase tracking-[0.14em] text-sheet-teal-dark">
          Sheet guide — what every panel calculates
        </summary>
        <div className="mt-2 grid gap-x-5 gap-y-2 leading-relaxed sm:grid-cols-2 lg:grid-cols-3">
          <p>
            <strong className="text-sheet-ink">Your Space.</strong> The animated banner beside
            Calendar Settings and Today displays your name. Use Personalize or Settings → Your Space
            to edit the name, its color, the atmosphere and the motion. Account names sync across
            devices; guests keep their name on this device.
          </p>
          <p>
            <strong className="text-sheet-ink">Today card.</strong> Shows the selected day and
            full date. The sun button returns to the current month and today. The calendar button
            lets you choose a day within the month and year set in Calendar Settings. The chosen
            day is highlighted in the Task log; selecting it never changes any checkmarks.
          </p>
          <p>
            <strong className="text-sheet-ink">Daily progress chart.</strong> For each day:
            checked tasks ÷ active tasks × 100. The dotted vertical line is today; hover a dot
            for that day&apos;s checked / target numbers.
          </p>
          <p>
            <strong className="text-sheet-ink">Overview daily progress (donut).</strong> Total
            checked boxes this month ÷ the sum of every task&apos;s monthly goal. The remainder is
            shaded pale blue and labelled LEFT.
          </p>
          <p>
            <strong className="text-sheet-ink">Calendar overview.</strong> Per day: checked,
            goal (number of active tasks) and left, followed by each week&apos;s checked ÷ target
            numbers, percentage and bar (e.g. 40/182 · 22%).
          </p>
          <p>
            <strong className="text-sheet-ink">Tasks sheet.</strong> Click a box to check a task
            for that date. The GOAL column is the monthly target check-ins; Σ is the row total.
            Click a task name to rename it, change its goal, reorder or delete. Use the
            &quot;Check all today&quot; and &quot;Clear month&quot; buttons above the grid for bulk
            changes.
          </p>
          <p>
            <strong className="text-sheet-ink">Months.</strong> Every month has its own task list
            and its own checkboxes. The first time you open a month, it starts with the tasks of
            the previous month and all boxes empty; after that, adding, renaming or deleting a task
            only changes that month.
          </p>
          <p>
            <strong className="text-sheet-ink">Account.</strong> As a guest your sheet is saved on
            this device. Sign in or create an account in Settings and everything — tasks, goals and
            every checkmark — moves into your account automatically. Signed-in data is stored in
            PostgreSQL, so switching months or devices preserves it all.
          </p>
        </div>
      </details>

      <TaskEditor
        state={editor}
        busy={busy}
        onClose={() => setEditor(null)}
        onCreate={createTask}
        onUpdate={updateTask}
        onDelete={deleteTask}
        onMove={moveTask}
      />

      {notice ? (
        <div
          role="status"
          className={`no-print fixed bottom-4 left-1/2 z-50 -translate-x-1/2 border px-3 py-2 text-[11px] font-semibold shadow-lg ${
            notice.tone === "error"
              ? "border-red-300 bg-red-50 text-red-800"
              : "border-sheet-teal-dark bg-[#eaf5f1] text-sheet-teal-deep"
          }`}
        >
          {notice.message}
        </div>
      ) : null}
    </div>
  );
}
