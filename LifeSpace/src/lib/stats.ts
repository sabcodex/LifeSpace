import { SheetMonth } from "./dates";

export type TaskRecord = {
  id: number;
  name: string;
  goal: number;
  position: number;
};

export type DayStat = {
  day: number;
  date: string;
  weekday: number;
  weekIndex: number;
  completed: number;
  goal: number;
  left: number;
  pct: number;
};

export type WeekStat = {
  index: number;
  label: string;
  days: DayStat[];
  completed: number;
  goal: number;
  left: number;
  pct: number;
};

export type TaskStat = {
  id: number;
  name: string;
  goal: number;
  position: number;
  completed: number;
  left: number;
  pct: number;
  weekCompleted: number[];
  bestStreak: number;
  currentStreak: number;
  marks: boolean[];
};

export type SheetStats = {
  dailyGoal: number;
  days: DayStat[];
  weeks: WeekStat[];
  totalCompleted: number;
  totalGoal: number;
  totalLeft: number;
  totalPct: number;
  maxDayPct: number;
  chartMax: number;
  tasks: TaskStat[];
  activeTaskCount: number;
};

export function completionKey(taskId: number, date: string): string {
  return `${taskId}|${date}`;
}

export function splitCompletionKey(key: string): { taskId: number; date: string } {
  const separator = key.indexOf("|");
  return {
    taskId: Number(key.slice(0, separator)),
    date: key.slice(separator + 1),
  };
}

export function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return (part / whole) * 100;
}

export function niceChartMax(value: number): number {
  if (value <= 0) return 40;
  const stepped = Math.ceil(value / 20) * 20;
  return Math.min(100, Math.max(40, stepped));
}

function streakInfo(marks: boolean[], referenceIndex: number) {
  let bestStreak = 0;
  let running = 0;
  for (const mark of marks) {
    running = mark ? running + 1 : 0;
    if (running > bestStreak) bestStreak = running;
  }

  let currentStreak = 0;
  for (let index = referenceIndex; index >= 0; index -= 1) {
    if (!marks[index]) break;
    currentStreak += 1;
  }

  return { bestStreak, currentStreak };
}

/**
 * Derives every panel of the sheet from two simple sources:
 * the task list (with monthly goals) and the checked boxes.
 */
export function computeSheet(
  month: SheetMonth,
  tasks: TaskRecord[],
  done: Set<string>,
  todayDate: string,
): SheetStats {
  const activeTasks = tasks.filter((task) => task.goal > 0);
  const activeIds = new Set(activeTasks.map((task) => task.id));
  const dailyGoal = activeTasks.length;

  const todayIndex = month.days.findIndex((day) => day.date === todayDate);
  const monthEndsInPast = month.days[month.days.length - 1]?.date < todayDate;
  const referenceIndex =
    todayIndex >= 0 ? todayIndex : monthEndsInPast ? month.daysInMonth - 1 : -1;

  const completedPerDay = new Map<string, number>();
  for (const key of done) {
    const { taskId, date } = splitCompletionKey(key);
    if (!activeIds.has(taskId)) continue;
    completedPerDay.set(date, (completedPerDay.get(date) ?? 0) + 1);
  }

  const taskStats: TaskStat[] = tasks.map((task) => {
    const marks = month.days.map((day) => done.has(completionKey(task.id, day.date)));
    const completed = marks.filter(Boolean).length;
    const goal = task.goal;
    const { bestStreak, currentStreak } = streakInfo(marks, referenceIndex);
    const weekCompleted = month.weeks.map(
      (week) =>
        week.days.filter((day) => done.has(completionKey(task.id, day.date))).length,
    );

    return {
      id: task.id,
      name: task.name,
      goal,
      position: task.position,
      completed,
      left: Math.max(0, goal - completed),
      pct: Math.min(100, pct(completed, goal)),
      weekCompleted,
      bestStreak,
      currentStreak,
      marks,
    };
  });

  const days: DayStat[] = month.days.map((day) => {
    const completed = completedPerDay.get(day.date) ?? 0;
    return {
      day: day.day,
      date: day.date,
      weekday: day.weekday,
      weekIndex: day.weekIndex,
      completed,
      goal: dailyGoal,
      left: Math.max(0, dailyGoal - completed),
      pct: pct(completed, dailyGoal),
    };
  });

  const weeks: WeekStat[] = month.weeks.map((week) => {
    const weekDays = days.filter((day) => day.weekIndex === week.index);
    const completed = weekDays.reduce((sum, day) => sum + day.completed, 0);
    const goal = weekDays.reduce((sum, day) => sum + day.goal, 0);
    return {
      index: week.index,
      label: week.label,
      days: weekDays,
      completed,
      goal,
      left: Math.max(0, goal - completed),
      pct: pct(completed, goal),
    };
  });

  const totalCompleted = taskStats.reduce((sum, task) => sum + task.completed, 0);
  const totalGoal = taskStats.reduce((sum, task) => sum + task.goal, 0);
  const maxDayPct = days.reduce((max, day) => Math.max(max, day.pct), 0);

  return {
    dailyGoal,
    days,
    weeks,
    totalCompleted,
    totalGoal,
    totalLeft: Math.max(0, totalGoal - totalCompleted),
    totalPct: Math.min(100, pct(totalCompleted, totalGoal)),
    maxDayPct,
    chartMax: niceChartMax(maxDayPct),
    tasks: taskStats,
    activeTaskCount: activeTasks.length,
  };
}
