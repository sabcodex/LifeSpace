"use client";

import { GUEST_DISPLAY_NAME_KEY } from "./display-name";
import { readGuestSheet, saveGuestSheet, type GuestSheet, type GuestTask } from "./guest-storage";
import { completionKey } from "./stats";
import { APPEARANCE_STORAGE_KEY } from "./theme";

/** A LifeSpace backup file: the whole sheet plus personal preferences. */
export type BackupFile = {
  app: "LifeSpace";
  version: 1;
  exportedAt: string;
  kind: "account" | "guest";
  sheet: GuestSheet;
  displayName?: string;
  appearance?: unknown;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function readJson(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

/** Builds the backup and triggers a .json download. */
export async function downloadBackup(options: { signedIn: boolean; displayName: string }) {
  let sheet: GuestSheet;
  let kind: BackupFile["kind"];

  if (options.signedIn) {
    const response = await fetch("/api/backup", { cache: "no-store" });
    const data = (await response.json()) as { ok?: boolean; sheet?: GuestSheet; error?: string };
    if (!response.ok || !data.ok || !data.sheet) {
      throw new Error(data.error ?? "Could not create your backup. Try again.");
    }
    sheet = data.sheet;
    kind = "account";
  } else {
    sheet = readGuestSheet() ?? { tasks: [], completions: [], months: [] };
    kind = "guest";
  }

  const backup: BackupFile = {
    app: "LifeSpace",
    version: 1,
    exportedAt: new Date().toISOString(),
    kind,
    sheet,
    displayName: options.displayName,
    appearance: readJson(APPEARANCE_STORAGE_KEY),
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `lifespace-backup-${stamp}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);

  try {
    window.localStorage.setItem("lifespace-last-backup", backup.exportedAt);
  } catch {
    // ignore
  }
  return { tasks: sheet.tasks.length, checks: sheet.completions.length };
}

export function lastBackupDate(): string | null {
  try {
    return window.localStorage.getItem("lifespace-last-backup");
  } catch {
    return null;
  }
}

/** Reads and validates a backup file chosen by the user. */
export async function readBackupFile(file: File): Promise<BackupFile> {
  if (file.size > 25 * 1024 * 1024) throw new Error("That file is too large to be a LifeSpace backup.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error("That file is not a LifeSpace backup.");
  }
  const candidate = parsed as Partial<BackupFile>;
  const sheet = candidate?.sheet as Partial<GuestSheet> | undefined;
  if (candidate?.app !== "LifeSpace" || !sheet || !Array.isArray(sheet.tasks) || !Array.isArray(sheet.completions)) {
    throw new Error("That file is not a LifeSpace backup.");
  }

  const now = new Date();
  const tasks: GuestTask[] = sheet.tasks
    .filter((task) => task && Number.isInteger(task.id) && typeof task.name === "string" && task.name.trim())
    .map((task) => ({
      id: task.id,
      name: task.name.trim().slice(0, 90),
      goal: Number.isInteger(task.goal) ? Math.min(31, Math.max(0, task.goal)) : 20,
      position: Number.isInteger(task.position) ? task.position : 0,
      year: Number.isInteger(task.year) ? task.year : now.getFullYear(),
      month: Number.isInteger(task.month) ? task.month : now.getMonth() + 1,
    }));

  return {
    app: "LifeSpace",
    version: 1,
    exportedAt: typeof candidate.exportedAt === "string" ? candidate.exportedAt : now.toISOString(),
    kind: candidate.kind === "account" ? "account" : "guest",
    sheet: {
      tasks,
      completions: sheet.completions.filter(
        (key): key is string => typeof key === "string" && DATE_PATTERN.test(key.slice(key.indexOf("|") + 1)),
      ),
      months: Array.isArray(sheet.months) ? sheet.months.filter((key): key is string => typeof key === "string") : [],
    },
    displayName: typeof candidate.displayName === "string" ? candidate.displayName.slice(0, 80) : undefined,
    appearance: candidate.appearance,
  };
}

/** Merges a backup into this browser's guest sheet without removing anything. */
function mergeIntoGuest(backup: BackupFile): { added: number; checks: number } {
  const current = readGuestSheet() ?? { tasks: [], completions: [], months: [] };
  const keyOf = (task: { year: number; month: number; name: string }) =>
    `${task.year}-${task.month}-${task.name.trim().toLowerCase()}`;
  const byKey = new Map(current.tasks.map((task) => [keyOf(task), task.id]));
  const idMap = new Map<number, number>();
  let nextId = current.tasks.reduce((max, task) => Math.max(max, task.id), 0) + 1;
  let added = 0;

  for (const task of backup.sheet.tasks) {
    const existing = byKey.get(keyOf(task));
    if (existing !== undefined) {
      idMap.set(task.id, existing);
      continue;
    }
    const id = nextId++;
    current.tasks.push({ ...task, id });
    byKey.set(keyOf(task), id);
    idMap.set(task.id, id);
    added += 1;
  }

  const completions = new Set(current.completions);
  const before = completions.size;
  for (const key of backup.sheet.completions) {
    const separator = key.indexOf("|");
    const id = idMap.get(Number(key.slice(0, separator)));
    if (id !== undefined) completions.add(completionKey(id, key.slice(separator + 1)));
  }
  current.completions = [...completions];
  current.months = [...new Set([...current.months, ...backup.sheet.months])];
  saveGuestSheet(current);
  return { added, checks: completions.size - before };
}

/** Restores a backup into the account (signed in) or this browser (guest). */
export async function restoreBackup(backup: BackupFile, options: { signedIn: boolean }) {
  let summary: { added: number; checks: number };

  if (options.signedIn) {
    const response = await fetch("/api/backup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheet: backup.sheet }),
    });
    const data = (await response.json()) as {
      ok?: boolean;
      error?: string;
      tasksCreated?: number;
      completionsAdded?: number;
    };
    if (!response.ok || !data.ok) throw new Error(data.error ?? "Could not restore your backup.");
    summary = { added: data.tasksCreated ?? 0, checks: data.completionsAdded ?? 0 };
  } else {
    summary = mergeIntoGuest(backup);
    if (backup.displayName) {
      try {
        window.localStorage.setItem(GUEST_DISPLAY_NAME_KEY, backup.displayName);
      } catch {
        // ignore
      }
    }
  }

  if (backup.appearance && typeof backup.appearance === "object") {
    try {
      window.localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(backup.appearance));
    } catch {
      // ignore
    }
  }
  return summary;
}
