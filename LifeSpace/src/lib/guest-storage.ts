"use client";

import { buildStarterCompletions, STARTER_TASKS } from "./starter-tasks";
import { completionKey } from "./stats";

/**
 * Guest mode: the whole sheet lives in localStorage so anyone can use the
 * organizer immediately. Like accounts, every task belongs to one month.
 * When the visitor signs in, this data is migrated into their account.
 */

export const GUEST_STORAGE_KEY = "organizer-guest-sheet";
export const PENDING_MIGRATION_KEY = "organizer-pending-migration";

export type GuestTask = {
  id: number;
  name: string;
  goal: number;
  position: number;
  year: number;
  month: number;
};

export type GuestSheet = {
  tasks: GuestTask[];
  completions: string[];
  /** "YYYY-M" keys of months already initialised, so their list is never re-copied. */
  months: string[];
};

export type GuestSheetPayload = GuestSheet;

export function monthKey(year: number, month: number): string {
  return `${year}-${month}`;
}

function readRaw(): GuestSheet | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GuestSheet> & {
      tasks?: Array<Partial<GuestTask>>;
    };
    if (!Array.isArray(parsed.tasks)) return null;

    // Older guest sheets had no month on tasks: they belong to the current month.
    const now = new Date();
    const tasks: GuestTask[] = parsed.tasks
      .filter((task) => Number.isInteger(task.id) && typeof task.name === "string")
      .map((task) => ({
        id: task.id as number,
        name: task.name as string,
        goal: Number.isInteger(task.goal) ? (task.goal as number) : 20,
        position: Number.isInteger(task.position) ? (task.position as number) : 0,
        year: Number.isInteger(task.year) ? (task.year as number) : now.getFullYear(),
        month: Number.isInteger(task.month) ? (task.month as number) : now.getMonth() + 1,
      }));

    return {
      tasks,
      completions: Array.isArray(parsed.completions) ? parsed.completions : [],
      months: Array.isArray(parsed.months) ? parsed.months : [],
    };
  } catch {
    return null;
  }
}

function writeRaw(data: GuestSheet) {
  try {
    window.localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage may be unavailable (private mode); the sheet still works in memory.
  }
}

/** Reads the guest sheet exactly as stored, without seeding. Null when absent. */
export function readGuestSheet(): GuestSheet | null {
  return readRaw();
}

/** Returns the guest sheet, seeding starter tasks (last month) on the very first visit. */
export function getOrSeedGuestSheet(): GuestSheet {
  const existing = readRaw();
  if (existing && (existing.tasks.length > 0 || existing.months.length > 0)) return existing;

  const now = new Date();
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();

  const tasks: GuestTask[] = STARTER_TASKS.map((task, index) => ({
    id: index + 1,
    name: task.name,
    goal: task.goal,
    position: index + 1,
    year: prevYear,
    month: prevMonth,
  }));

  const completions: string[] = [];
  for (const completion of buildStarterCompletions(now)) {
    const task = tasks[completion.taskIndex];
    if (task) completions.push(completionKey(task.id, completion.date));
  }

  const seeded: GuestSheet = { tasks, completions, months: [monthKey(prevYear, prevMonth)] };
  writeRaw(seeded);
  return seeded;
}

/**
 * Gives a month its own task list the first time it is opened, copied from the
 * nearest earlier month (or nearest later). Checkboxes are not copied.
 */
export function ensureGuestMonth(data: GuestSheet, year: number, month: number): GuestSheet {
  const key = monthKey(year, month);
  if (data.months.includes(key)) return data;

  const hasOwn = data.tasks.some((task) => task.year === year && task.month === month);
  if (!hasOwn) {
    const target = year * 12 + month;
    const monthsWithTasks = [...new Set(data.tasks.map((task) => task.year * 12 + task.month))];
    const earlier = monthsWithTasks.filter((value) => value < target).sort((a, b) => b - a)[0];
    const later = monthsWithTasks.filter((value) => value > target).sort((a, b) => a - b)[0];
    const source = earlier ?? later;

    if (source !== undefined) {
      let nextId = data.tasks.reduce((max, task) => Math.max(max, task.id), 0) + 1;
      const template = data.tasks
        .filter((task) => task.year * 12 + task.month === source)
        .sort((a, b) => a.position - b.position || a.id - b.id);
      for (const task of template) {
        data.tasks.push({ ...task, id: nextId, year, month });
        nextId += 1;
      }
    }
  }

  data.months.push(key);
  writeRaw(data);
  return data;
}

export function saveGuestSheet(data: GuestSheet) {
  writeRaw(data);
}

export function clearGuestSheet() {
  try {
    window.localStorage.removeItem(GUEST_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Snapshot used when registering / signing in, so no guest progress is lost. */
export function collectGuestSheet(): GuestSheetPayload | null {
  return readGuestSheet();
}
