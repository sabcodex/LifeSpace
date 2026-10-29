import { toDateStr } from "./dates";

/** Tasks every brand-new sheet starts with, so it is never blank. Shared by the
 * server-side account seeder and the in-browser guest seeder. */
export const STARTER_TASKS: Array<{ name: string; goal: number }> = [
  { name: "Study / revise lessons", goal: 26 },
  { name: "Read (book, article, etc.)", goal: 24 },
  { name: "Practice a skill", goal: 24 },
  { name: "Review notes", goal: 20 },
  { name: "Plan your day", goal: 30 },
  { name: "Limit social media time", goal: 30 },
  { name: "Exercise / move 30 min", goal: 22 },
  { name: "Drink 2L of water", goal: 28 },
  { name: "Inbox zero", goal: 18 },
  { name: "Journal / reflect", goal: 20 },
];

export type StarterCompletion = { taskIndex: number; date: string };

/** Deterministic-but-natural looking seed pattern (dips included) for the previous month. */
function shouldComplete(taskIndex: number, day: number): boolean {
  const seed = (taskIndex + 1) * 37 + day * 61 + day * day * 3;
  const random = ((seed * 9301 + 49297) % 233280) / 233280;
  const slump = (day * 7 + taskIndex * 5) % 13 < 3 ? 0.34 : 0.95;
  return random < 0.78 * slump;
}

export function buildStarterCompletions(reference: Date = new Date()): StarterCompletion[] {
  const previous = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() - 1, 1));
  const year = previous.getUTCFullYear();
  const month = previous.getUTCMonth() + 1;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const completions: StarterCompletion[] = [];
  STARTER_TASKS.forEach((task, taskIndex) => {
    for (let day = 1; day <= daysInMonth; day += 1) {
      if (shouldComplete(taskIndex, day) && completions.filter((c) => c.taskIndex === taskIndex).length < task.goal) {
        completions.push({ taskIndex, date: toDateStr(year, month, day) });
      }
    }
  });
  return completions;
}
