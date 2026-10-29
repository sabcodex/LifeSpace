export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const WEEKDAY_LONG = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type SheetDay = {
  day: number;
  date: string;
  /** 0 = Monday ... 6 = Sunday (calendar is Monday-first, as in the sheet) */
  weekday: number;
  weekIndex: number;
};

export type SheetWeek = {
  index: number;
  label: string;
  days: SheetDay[];
  firstDate: string;
  lastDate: string;
};

export type SheetMonth = {
  year: number;
  month: number;
  monthLabel: string;
  monthShort: string;
  daysInMonth: number;
  leadingBlanks: number;
  days: SheetDay[];
  weeks: SheetWeek[];
};

export function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function clampInt(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

export function buildMonth(year: number, month: number): SheetMonth {
  const monthIndex = clampInt(month, 1, 12, 1) - 1;
  const safeYear = clampInt(year, 2000, 2100, 2024);
  const daysInMonth = new Date(Date.UTC(safeYear, monthIndex + 1, 0)).getUTCDate();
  const firstWeekday = (new Date(Date.UTC(safeYear, monthIndex, 1)).getUTCDay() + 6) % 7;
  const weekCount = Math.ceil((firstWeekday + daysInMonth) / 7);

  const days: SheetDay[] = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const slot = firstWeekday + index;
    return {
      day,
      date: toDateStr(safeYear, monthIndex + 1, day),
      weekday: slot % 7,
      weekIndex: Math.floor(slot / 7),
    };
  });

  const weeks: SheetWeek[] = Array.from({ length: weekCount }, (_, weekIndex) => {
    const weekDays = days.filter((day) => day.weekIndex === weekIndex);
    return {
      index: weekIndex,
      label: `WEEK ${weekIndex + 1}`,
      days: weekDays,
      firstDate: weekDays[0]?.date ?? "",
      lastDate: weekDays[weekDays.length - 1]?.date ?? "",
    };
  });

  return {
    year: safeYear,
    month: monthIndex + 1,
    monthLabel: MONTH_NAMES[monthIndex],
    monthShort: MONTH_NAMES[monthIndex].slice(0, 3),
    daysInMonth,
    leadingBlanks: firstWeekday,
    days,
    weeks,
  };
}

/** "Sunday 25 October 2026" */
export function formatFullDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return dateStr;
  const weekday = (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
  return `${WEEKDAY_LONG[weekday]} ${day} ${MONTH_NAMES[month - 1]} ${year}`;
}

export function formatLongDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return dateStr;
  const weekday = (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
  return `${WEEKDAY_SHORT[weekday]} ${MONTH_NAMES[month - 1].slice(0, 3)} ${day}, ${year}`;
}

export function previousMonth(year: number, month: number): { year: number; month: number } {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

export function nextMonth(year: number, month: number): { year: number; month: number } {
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}

export function todayParts(now: Date = new Date()): { year: number; month: number; day: number; date: string } {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  return { year, month, day, date: toDateStr(year, month, day) };
}

export function todayStr(now: Date = new Date()): string {
  return todayParts(now).date;
}
