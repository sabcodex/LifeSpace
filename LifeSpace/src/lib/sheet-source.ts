"use client";

import { buildMonth, clampInt } from "./dates";
import {
  clearGuestSheet,
  ensureGuestMonth,
  getOrSeedGuestSheet,
  readGuestSheet,
  saveGuestSheet,
  type GuestTask,
} from "./guest-storage";
import { completionKey, type TaskRecord } from "./stats";

export type SheetEntry = { taskId: number; date: string; completed: boolean };
export type SheetTaskPatch = { name?: string; goal?: number; position?: number };

/** A data source bound to one month of one sheet (account or guest). */
export type SheetSource = {
  loadMonth: () => Promise<{ tasks: TaskRecord[]; done: string[] }>;
  createTask: (name: string, goal: number) => Promise<TaskRecord>;
  updateTask: (id: number, patch: SheetTaskPatch) => Promise<TaskRecord | null>;
  deleteTask: (id: number) => Promise<void>;
  applyCompletions: (entries: SheetEntry[]) => Promise<void>;
};

const toRecord = (task: GuestTask): TaskRecord => ({
  id: task.id,
  name: task.name,
  goal: task.goal,
  position: task.position,
});

/* ───────────── Source backed by the PostgreSQL API (signed-in users) ───────────── */

function createApiSource(year: number, month: number): SheetSource {
  return {
    async loadMonth() {
      const response = await fetch(`/api/tasks?year=${year}&month=${month}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load the sheet.");
      const data = (await response.json()) as { tasks?: TaskRecord[]; done?: string[] };
      return {
        tasks: Array.isArray(data.tasks) ? data.tasks : [],
        done: Array.isArray(data.done) ? data.done : [],
      };
    },

    async createTask(name, goal) {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, goal, year, month }),
      });
      const data = (await response.json()) as { task?: TaskRecord; error?: string };
      if (!response.ok || !data.task) throw new Error(data.error ?? "Unable to create the task.");
      return data.task;
    },

    async updateTask(id, patch) {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = (await response.json()) as { task?: TaskRecord; error?: string };
      if (!response.ok || !data.task) throw new Error(data.error ?? "Unable to save the task.");
      return data.task;
    },

    async deleteTask(id) {
      const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Unable to delete the task.");
    },

    async applyCompletions(entries) {
      if (entries.length === 0) return;
      const response = await fetch("/api/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });
      if (!response.ok) throw new Error("Unable to save the checkbox.");
    },
  };
}

/* ───────────── Source backed by localStorage (guests) ───────────── */

function createGuestSource(year: number, month: number): SheetSource {
  const monthInfo = buildMonth(year, month);
  const first = monthInfo.days[0]?.date ?? "";
  const last = monthInfo.days[monthInfo.days.length - 1]?.date ?? "";
  const load = () => ensureGuestMonth(getOrSeedGuestSheet(), year, month);
  const inMonth = (task: GuestTask) => task.year === year && task.month === month;

  return {
    async loadMonth() {
      const data = load();
      const monthTasks = data.tasks
        .filter(inMonth)
        .sort((a, b) => a.position - b.position || a.id - b.id);
      const ids = new Set(monthTasks.map((task) => task.id));
      const done = data.completions.filter((key) => {
        const separator = key.indexOf("|");
        const date = key.slice(separator + 1);
        return ids.has(Number(key.slice(0, separator))) && date >= first && date <= last;
      });
      return { tasks: monthTasks.map(toRecord), done };
    },

    async createTask(name, goal) {
      const data = load();
      const cleanName = name.trim().slice(0, 90);
      if (!cleanName) throw new Error("Task name is required.");
      const task: GuestTask = {
        id: data.tasks.reduce((max, item) => Math.max(max, item.id), 0) + 1,
        name: cleanName,
        goal: clampInt(goal, 0, 31, 20),
        position: data.tasks.filter(inMonth).reduce((max, item) => Math.max(max, item.position), 0) + 1,
        year,
        month,
      };
      data.tasks.push(task);
      saveGuestSheet(data);
      return toRecord(task);
    },

    async updateTask(id, patch) {
      const data = load();
      const task = data.tasks.find((candidate) => candidate.id === id);
      if (!task) return null;
      if (patch.name !== undefined) {
        const cleanName = patch.name.trim().slice(0, 90);
        if (!cleanName) throw new Error("Task name is required.");
        task.name = cleanName;
      }
      if (patch.goal !== undefined) task.goal = clampInt(patch.goal, 0, 31, 20);
      if (patch.position !== undefined) task.position = clampInt(patch.position, 0, 9999, 0);
      saveGuestSheet(data);
      return toRecord(task);
    },

    async deleteTask(id) {
      const data = load();
      data.tasks = data.tasks.filter((task) => task.id !== id);
      data.completions = data.completions.filter((key) => !key.startsWith(`${id}|`));
      saveGuestSheet(data);
    },

    async applyCompletions(entries) {
      if (entries.length === 0) return;
      const data = load();
      const set = new Set(data.completions);
      for (const entry of entries) {
        const key = completionKey(entry.taskId, entry.date);
        if (entry.completed) set.add(key);
        else set.delete(key);
      }
      data.completions = [...set];
      saveGuestSheet(data);
    },
  };
}

export function createSheetSource(userId: number | null, year: number, month: number): SheetSource {
  return userId === null ? createGuestSource(year, month) : createApiSource(year, month);
}

export function isGuestDataEmpty(): boolean {
  const guest = readGuestSheet();
  return !guest || (guest.tasks.length === 0 && guest.completions.length === 0);
}

export { clearGuestSheet };
