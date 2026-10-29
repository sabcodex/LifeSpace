import { and, asc, desc, eq, gte, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { sheetMonths, taskCompletions, tasks } from "@/db/schema";
import { ensureAuthReady } from "@/lib/auth";
import { buildMonth, clampInt } from "@/lib/dates";
import { buildStarterCompletions, STARTER_TASKS } from "@/lib/starter-tasks";
import { completionKey, type TaskRecord } from "@/lib/stats";

/** What a guest sends when they sign in, so their local sheet moves into the account. */
export type GuestSheetPayload = {
  tasks: Array<{
    id: number;
    name: string;
    goal: number;
    position: number;
    year: number;
    month: number;
  }>;
  completions: string[];
  months: string[];
};

let readyPromise: Promise<void> | null = null;

export function ensureSheetReady(): Promise<void> {
  if (!readyPromise) {
    readyPromise = (async () => {
      await ensureAuthReady();
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "tasks" (
          "id" serial PRIMARY KEY NOT NULL,
          "user_id" integer REFERENCES "users"("id") ON DELETE CASCADE,
          "year" integer DEFAULT 0 NOT NULL,
          "month" integer DEFAULT 0 NOT NULL,
          "name" text NOT NULL,
          "goal" integer DEFAULT 26 NOT NULL,
          "position" integer DEFAULT 0 NOT NULL,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL
        )
      `);
      await db.execute(sql`ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "user_id" integer REFERENCES "users"("id") ON DELETE CASCADE`);
      await db.execute(sql`ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "year" integer DEFAULT 0 NOT NULL`);
      await db.execute(sql`ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "month" integer DEFAULT 0 NOT NULL`);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "task_completions" (
          "id" serial PRIMARY KEY NOT NULL,
          "task_id" integer NOT NULL REFERENCES "tasks"("id") ON DELETE CASCADE,
          "date" date NOT NULL,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL
        )
      `);
      await db.execute(sql`
        CREATE UNIQUE INDEX IF NOT EXISTS "task_completions_task_date_idx"
        ON "task_completions" ("task_id", "date")
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "sheet_months" (
          "id" serial PRIMARY KEY NOT NULL,
          "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "year" integer NOT NULL,
          "month" integer NOT NULL,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL
        )
      `);
      await db.execute(sql`
        CREATE UNIQUE INDEX IF NOT EXISTS "sheet_months_user_month_idx"
        ON "sheet_months" ("user_id", "year", "month")
      `);
    })().catch((error) => {
      readyPromise = null;
      throw error;
    });
  }
  return readyPromise;
}

function previousOf(year: number, month: number) {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Makes sure a month has its own task list. The first time a month is opened,
 * the list is copied from the nearest earlier month (or the nearest later one
 * if there is none). Checkboxes are never copied, so the new month starts empty.
 * Afterwards each month is edited independently.
 */
async function ensureMonth(tx: Tx, userId: number, year: number, month: number) {
  // Serialise per user so two tabs never copy the same month twice.
  await tx.execute(sql`select pg_advisory_xact_lock(${userId})`);

  const [initialised] = await tx
    .select({ id: sheetMonths.id })
    .from(sheetMonths)
    .where(and(eq(sheetMonths.userId, userId), eq(sheetMonths.year, year), eq(sheetMonths.month, month)))
    .limit(1);
  if (initialised) return;

  const existing = await tx
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.year, year), eq(tasks.month, month)))
    .limit(1);

  if (existing.length === 0) {
    const key = year * 12 + month;
    const monthKey = sql`(${tasks.year} * 12 + ${tasks.month})`;

    let [source] = await tx
      .select({ year: tasks.year, month: tasks.month })
      .from(tasks)
      .where(and(eq(tasks.userId, userId), sql`${monthKey} < ${key}`, sql`${tasks.year} > 0`))
      .orderBy(desc(tasks.year), desc(tasks.month))
      .limit(1);

    if (!source) {
      [source] = await tx
        .select({ year: tasks.year, month: tasks.month })
        .from(tasks)
        .where(and(eq(tasks.userId, userId), sql`${monthKey} > ${key}`))
        .orderBy(asc(tasks.year), asc(tasks.month))
        .limit(1);
    }

    if (source) {
      const template = await tx
        .select({ name: tasks.name, goal: tasks.goal, position: tasks.position })
        .from(tasks)
        .where(and(eq(tasks.userId, userId), eq(tasks.year, source.year), eq(tasks.month, source.month)))
        .orderBy(asc(tasks.position), asc(tasks.id));

      if (template.length > 0) {
        await tx.insert(tasks).values(
          template.map((task) => ({ userId, year, month, name: task.name, goal: task.goal, position: task.position })),
        );
      }
    }
  }

  await tx.insert(sheetMonths).values({ userId, year, month }).onConflictDoNothing();
}

/** Gives a brand-new account a populated sheet: starter tasks + example check-ins last month. */
export async function seedStarterSheet(userId: number): Promise<void> {
  await ensureSheetReady();

  const existing = await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.userId, userId)).limit(1);
  if (existing.length > 0) return;

  const now = new Date();
  const prev = previousOf(now.getFullYear(), now.getMonth() + 1);

  await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(tasks)
      .values(
        STARTER_TASKS.map((task, index) => ({
          userId,
          year: prev.year,
          month: prev.month,
          name: task.name,
          goal: task.goal,
          position: index + 1,
        })),
      )
      .returning({ id: tasks.id });
    await tx.insert(sheetMonths).values({ userId, year: prev.year, month: prev.month }).onConflictDoNothing();

    const rows: Array<{ taskId: number; date: string }> = [];
    buildStarterCompletions(now).forEach((completion) => {
      const task = inserted[completion.taskIndex];
      if (task) rows.push({ taskId: task.id, date: completion.date });
    });
    if (rows.length > 0) await tx.insert(taskCompletions).values(rows).onConflictDoNothing();
  });
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Moves a guest's locally-stored sheet into an account. Tasks are matched per
 * month by name (case-insensitive) so signing in twice never duplicates them.
 */
export async function mergeGuestData(
  userId: number,
  guest: GuestSheetPayload,
): Promise<{ tasksCreated: number; completionsAdded: number }> {
  await ensureSheetReady();

  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${userId})`);

    const existing = await tx.select().from(tasks).where(eq(tasks.userId, userId));
    const keyOf = (year: number, month: number, name: string) =>
      `${year}-${month}-${name.trim().toLowerCase()}`;
    const byKey = new Map(existing.map((task) => [keyOf(task.year, task.month, task.name), task.id]));
    const idMap = new Map<number, number>();
    let tasksCreated = 0;

    const ordered = [...guest.tasks].sort(
      (a, b) => a.year - b.year || a.month - b.month || a.position - b.position || a.id - b.id,
    );

    for (const guestTask of ordered) {
      if (!guestTask.name?.trim()) continue;
      const key = keyOf(guestTask.year, guestTask.month, guestTask.name);
      const found = byKey.get(key);
      if (found) {
        idMap.set(guestTask.id, found);
        continue;
      }
      const [created] = await tx
        .insert(tasks)
        .values({
          userId,
          year: guestTask.year,
          month: guestTask.month,
          name: guestTask.name.trim().slice(0, 90),
          goal: clampInt(guestTask.goal, 0, 31, 20),
          position: clampInt(guestTask.position, 0, 9999, 0),
        })
        .returning({ id: tasks.id });
      tasksCreated += 1;
      idMap.set(guestTask.id, created.id);
      byKey.set(key, created.id);
    }

    // Every month the guest opened (and every month with tasks) is now "initialised".
    const monthSet = new Set<string>(guest.months);
    for (const task of guest.tasks) monthSet.add(`${task.year}-${task.month}`);
    const monthRows = [...monthSet]
      .map((value) => value.split("-").map(Number))
      .filter(([y, m]) => Number.isInteger(y) && y >= 2000 && y <= 2100 && m >= 1 && m <= 12)
      .map(([y, m]) => ({ userId, year: y, month: m }));
    if (monthRows.length > 0) await tx.insert(sheetMonths).values(monthRows).onConflictDoNothing();

    const rows = new Map<string, { taskId: number; date: string }>();
    for (const key of guest.completions) {
      const separator = key.indexOf("|");
      if (separator <= 0) continue;
      const taskId = idMap.get(Number(key.slice(0, separator)));
      const date = key.slice(separator + 1);
      if (!taskId || !DATE_PATTERN.test(date)) continue;
      rows.set(completionKey(taskId, date), { taskId, date });
    }
    const values = [...rows.values()];
    let completionsAdded = 0;
    for (let offset = 0; offset < values.length; offset += 400) {
      // Only rows that were actually new are returned, so re-restoring reports 0.
      const inserted = await tx
        .insert(taskCompletions)
        .values(values.slice(offset, offset + 400))
        .onConflictDoNothing()
        .returning({ id: taskCompletions.id });
      completionsAdded += inserted.length;
    }

    return { tasksCreated, completionsAdded };
  });
}

export function parseGuestPayload(value: unknown): GuestSheetPayload | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<GuestSheetPayload>;
  if (!Array.isArray(candidate.tasks) || !Array.isArray(candidate.completions)) return null;
  const now = new Date();
  return {
    tasks: candidate.tasks
      .filter((task) => !!task && Number.isInteger(task.id) && typeof task.name === "string")
      .map((task) => ({
        id: task.id,
        name: task.name,
        goal: Number.isInteger(task.goal) ? task.goal : 20,
        position: Number.isInteger(task.position) ? task.position : 0,
        year: Number.isInteger(task.year) ? task.year : now.getFullYear(),
        month: Number.isInteger(task.month) ? task.month : now.getMonth() + 1,
      })),
    completions: candidate.completions.filter((key): key is string => typeof key === "string"),
    months: Array.isArray(candidate.months)
      ? candidate.months.filter((key): key is string => typeof key === "string")
      : [],
  };
}

/**
 * Full copy of an account's sheet (every month), in the same format as a guest
 * sheet, so a backup can be restored into any account or guest browser.
 */
export async function exportUserSheet(userId: number): Promise<GuestSheetPayload> {
  await ensureSheetReady();

  const taskRows = await db
    .select({
      id: tasks.id,
      name: tasks.name,
      goal: tasks.goal,
      position: tasks.position,
      year: tasks.year,
      month: tasks.month,
    })
    .from(tasks)
    .where(eq(tasks.userId, userId))
    .orderBy(asc(tasks.year), asc(tasks.month), asc(tasks.position), asc(tasks.id));

  const completionRows = await db
    .select({ taskId: taskCompletions.taskId, date: taskCompletions.date })
    .from(taskCompletions)
    .innerJoin(tasks, eq(tasks.id, taskCompletions.taskId))
    .where(eq(tasks.userId, userId));

  const monthRows = await db
    .select({ year: sheetMonths.year, month: sheetMonths.month })
    .from(sheetMonths)
    .where(eq(sheetMonths.userId, userId));

  return {
    tasks: taskRows.filter((task) => task.year > 0 && task.month > 0),
    completions: completionRows.map((row) => completionKey(row.taskId, row.date)),
    months: monthRows.map((row) => `${row.year}-${row.month}`),
  };
}

export type SheetData = { tasks: TaskRecord[]; done: string[] };

export async function loadSheet(userId: number, year: number, month: number): Promise<SheetData> {
  await ensureSheetReady();
  await db.transaction((tx) => ensureMonth(tx, userId, year, month));

  const monthInfo = buildMonth(year, month);
  const first = monthInfo.days[0]?.date ?? `${year}-${String(month).padStart(2, "0")}-01`;
  const last = monthInfo.days[monthInfo.days.length - 1]?.date ?? first;

  const taskRows = await db
    .select({ id: tasks.id, name: tasks.name, goal: tasks.goal, position: tasks.position })
    .from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.year, year), eq(tasks.month, month)))
    .orderBy(asc(tasks.position), asc(tasks.id));

  const taskIds = taskRows.map((task) => task.id);
  if (taskIds.length === 0) return { tasks: [], done: [] };

  const completionRows = await db
    .select({ taskId: taskCompletions.taskId, date: taskCompletions.date })
    .from(taskCompletions)
    .where(
      and(
        or(...taskIds.map((id) => eq(taskCompletions.taskId, id))),
        gte(taskCompletions.date, first),
        lte(taskCompletions.date, last),
      ),
    );

  return {
    tasks: taskRows,
    done: completionRows.map((row) => completionKey(row.taskId, row.date)),
  };
}

export async function createTaskRecord(
  userId: number,
  year: number,
  month: number,
  name: string,
  goal: number,
): Promise<TaskRecord> {
  await ensureSheetReady();
  const cleanName = name.trim().slice(0, 90);
  if (!cleanName) throw new Error("Task name is required.");

  const [maxRow] = await db
    .select({ maxPosition: sql<number>`coalesce(max(${tasks.position}), 0)::int` })
    .from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.year, year), eq(tasks.month, month)));

  const [created] = await db
    .insert(tasks)
    .values({
      userId,
      year,
      month,
      name: cleanName,
      goal: clampInt(goal, 0, 31, 20),
      position: (maxRow?.maxPosition ?? 0) + 1,
    })
    .returning({ id: tasks.id, name: tasks.name, goal: tasks.goal, position: tasks.position });

  await db.insert(sheetMonths).values({ userId, year, month }).onConflictDoNothing();
  return created;
}

export async function updateTaskRecord(
  userId: number,
  id: number,
  patch: { name?: string; goal?: number; position?: number },
): Promise<TaskRecord | null> {
  await ensureSheetReady();

  const values: { name?: string; goal?: number; position?: number } = {};
  if (typeof patch.name === "string") {
    const cleanName = patch.name.trim().slice(0, 90);
    if (!cleanName) throw new Error("Task name is required.");
    values.name = cleanName;
  }
  if (patch.goal !== undefined) values.goal = clampInt(patch.goal, 0, 31, 20);
  if (patch.position !== undefined) values.position = clampInt(patch.position, 0, 9999, 0);
  if (Object.keys(values).length === 0) return null;

  const [updated] = await db
    .update(tasks)
    .set(values)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .returning({ id: tasks.id, name: tasks.name, goal: tasks.goal, position: tasks.position });

  return updated ?? null;
}

export async function deleteTaskRecord(userId: number, id: number): Promise<void> {
  await ensureSheetReady();
  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
}

export type CompletionEntry = { taskId: number; date: string; completed: boolean };

export async function applyCompletionEntries(
  userId: number,
  entries: CompletionEntry[],
): Promise<number> {
  await ensureSheetReady();

  const ids = [...new Set(entries.map((entry) => entry.taskId).filter(Number.isInteger))];
  if (ids.length === 0) return 0;

  const owned = new Set(
    (
      await db
        .select({ id: tasks.id })
        .from(tasks)
        .where(and(eq(tasks.userId, userId), or(...ids.map((id) => eq(tasks.id, id)))))
    ).map((task) => task.id),
  );

  const valid = entries.filter(
    (entry) =>
      owned.has(entry.taskId) &&
      DATE_PATTERN.test(entry.date) &&
      entry.date >= "2000-01-01" &&
      entry.date <= "2100-12-31",
  );
  if (valid.length === 0) return 0;

  const toInsert = new Map<string, { taskId: number; date: string }>();
  for (const entry of valid.filter((item) => item.completed)) {
    toInsert.set(completionKey(entry.taskId, entry.date), { taskId: entry.taskId, date: entry.date });
  }
  if (toInsert.size > 0) {
    await db.insert(taskCompletions).values([...toInsert.values()]).onConflictDoNothing();
  }

  for (const entry of valid.filter((item) => !item.completed)) {
    await db
      .delete(taskCompletions)
      .where(and(eq(taskCompletions.taskId, entry.taskId), eq(taskCompletions.date, entry.date)));
  }

  return valid.length;
}
