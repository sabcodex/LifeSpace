"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { DailyAreaChart, DailyDonut } from "@/components/charts";
import { DayPicker } from "@/components/DayPicker";
import { Card, Icon, IconButton } from "@/components/ui";
import { formatFullDate, MONTH_NAMES, type SheetMonth } from "@/lib/dates";
import type { SheetStats } from "@/lib/stats";

export function OrganizerCard({
  month,
  selectedDate,
  today,
  onSelectDay,
  onToday,
  disabled = false,
}: {
  month: SheetMonth;
  selectedDate: string;
  today: string;
  onSelectDay: (day: number) => void;
  onToday: () => void;
  disabled?: boolean;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pickerId = useId();
  const [weekdayPart, ...restParts] = formatFullDate(selectedDate).split(" ");

  const closePicker = useCallback(() => {
    setPickerOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!pickerOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setPickerOpen(false);
    };
    const onFocusOutside = (event: FocusEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setPickerOpen(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePicker();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("focusin", onFocusOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("focusin", onFocusOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [pickerOpen, closePicker]);

  return (
    <div ref={containerRef} className="relative h-full min-h-0" data-today-card>
      <Card className="flex h-full flex-col overflow-hidden">
        <div className="brand-gradient flex h-[30px] shrink-0 items-center justify-center px-3 text-center">
          <h1 className="text-[11px] font-bold uppercase leading-none tracking-[0.14em] text-white [text-shadow:0_1px_1px_rgba(0,0,0,0.28)]">
            Today
          </h1>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center bg-[#f4faf8] px-2 py-1 text-center" aria-live="polite" aria-atomic="true">
          <time dateTime={selectedDate}>
            <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-sheet-teal-dark">
              {weekdayPart}
            </span>
            <span className="num block text-[12px] font-extrabold leading-tight text-sheet-teal-deep">
              {restParts.join(" ")}
            </span>
          </time>
        </div>

        <div className="no-print flex shrink-0 items-center justify-between gap-1 border-t border-[#dde6e4] px-2 py-1.5">
          <IconButton
            label="Jump to the current month"
            onClick={() => {
              setPickerOpen(false);
              onToday();
            }}
            disabled={disabled}
            tone="teal"
            className="min-w-0 flex-1 px-1"
          >
            <Icon name="sun" className="h-3.5 w-3.5" />
          </IconButton>
          <button
            ref={triggerRef}
            type="button"
            aria-label="Select a day"
            title={`Select a day in ${month.monthLabel} ${month.year}`}
            aria-haspopup="dialog"
            aria-expanded={pickerOpen}
            aria-controls={pickerId}
            disabled={disabled}
            onClick={() => setPickerOpen((current) => !current)}
            className="day-picker-trigger inline-flex h-7 min-w-0 flex-1 items-center justify-center border px-1 transition-colors disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Icon name="calendar" className="h-3.5 w-3.5" />
          </button>
        </div>
      </Card>

      {pickerOpen ? (
        <DayPicker
          id={pickerId}
          month={month}
          selectedDate={selectedDate}
          today={today}
          onSelect={(day) => {
            onSelectDay(day);
            closePicker();
          }}
          onClose={closePicker}
        />
      ) : null}
    </div>
  );
}

export function CalendarSettingsCard({
  year,
  month,
  onMonthChange,
}: {
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
}) {
  const currentYear = new Date().getFullYear();
  const years = [...new Set([currentYear - 3, currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2, currentYear + 3, year])]
    .sort((a, b) => a - b);

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="brand-gradient flex h-[30px] shrink-0 items-center justify-center px-3 text-center">
        <h2 className="text-[11px] font-bold uppercase leading-none tracking-[0.14em] text-white [text-shadow:0_1px_1px_rgba(0,0,0,0.28)]">
          Calendar Settings
        </h2>
      </div>
      <div className="grid flex-1 grid-cols-[58px_minmax(0,1fr)] gap-px bg-[#d7e0df] p-px text-[10px]">
        <label htmlFor="calendar-year" className="flex items-center bg-white px-1.5 font-bold uppercase tracking-[0.08em] text-[#5c3b3b]">
          Year
        </label>
        <div className="flex items-center bg-[#f2f5f4] px-1">
          <select
            id="calendar-year"
            aria-label="Calendar year"
            value={year}
            onChange={(event) => onMonthChange(Number(event.target.value), month)}
            className="h-[22px] w-full border border-[#b9c7c5] bg-white px-1 text-[10.5px] text-[#22322f] outline-none focus:border-sheet-teal"
          >
            {years.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <label htmlFor="calendar-month" className="flex items-center bg-white px-1.5 font-bold uppercase tracking-[0.08em] text-[#5c3b3b]">
          Month
        </label>
        <div className="flex items-center bg-[#f2f5f4] px-1">
          <select
            id="calendar-month"
            aria-label="Calendar month"
            value={month}
            onChange={(event) => onMonthChange(year, Number(event.target.value))}
            className="h-[22px] w-full border border-[#b9c7c5] bg-white px-1 text-[10.5px] text-[#22322f] outline-none focus:border-sheet-teal"
          >
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Card>
  );
}

export function DailyProgressCard({
  stats,
  monthLabel,
  year,
  today,
}: {
  stats: SheetStats;
  monthLabel: string;
  year: number;
  today: string;
}) {
  const average =
    stats.days.length > 0
      ? stats.days.reduce((sum, day) => sum + day.pct, 0) / stats.days.length
      : 0;

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-[#dfe8ea] px-3 py-1.5">
        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-sheet-teal-dark">
          Daily Progress
        </span>
        <span className="text-[9.5px] font-semibold text-sheet-muted">
          {monthLabel.slice(0, 3)} {year} · {stats.days.length} days
        </span>
      </div>
      <div className="scroll-thin flex min-h-0 flex-1 items-center overflow-x-auto overflow-y-hidden px-2 py-1">
        <div className="w-full min-w-[480px]">
          <DailyAreaChart days={stats.days} chartMax={stats.chartMax} today={today} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-[#e6edef] px-3 py-1.5 text-[9.5px] text-sheet-muted">
        <span>
          Avg. rate <strong className="text-sheet-ink">{average.toFixed(1)}%</strong>
        </span>
        <span>
          Best day <strong className="text-sheet-ink">{stats.maxDayPct.toFixed(0)}%</strong>
        </span>
        <span>
          Daily target <strong className="text-sheet-ink">{stats.dailyGoal}</strong>
        </span>
      </div>
    </Card>
  );
}

export function DonutCard({ stats, monthLabel }: { stats: SheetStats; monthLabel: string }) {
  const left = Math.max(0, stats.totalGoal - stats.totalCompleted);
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-[#dbe6e8] bg-[#fbfdfc] px-3 py-[7px]">
        <span className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#22312e]">
          Overview Daily Progress
        </span>
        <span className="text-[9.5px] font-semibold text-sheet-muted">
          {monthLabel} {stats.totalPct.toFixed(1)}% complete
        </span>
      </div>
      <div className="flex flex-1 flex-col items-center gap-2 px-3 py-2 sm:flex-row sm:justify-center sm:gap-6">
        <div className="w-full max-w-[300px] shrink-0">
          <DailyDonut
            pctCompleted={stats.totalPct}
            completed={stats.totalCompleted}
            goal={stats.totalGoal}
          />
        </div>
        <div className="grid w-full max-w-[420px] grid-cols-3 gap-2">
          <div className="border border-[#dbe6e8] bg-[#f5faf8] px-2 py-2 text-center">
            <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#5a6a66]">Completed</p>
            <p className="num text-[14px] font-extrabold text-sheet-blue-deep">
              {stats.totalCompleted}
            </p>
          </div>
          <div className="border border-[#dbe6e8] bg-[#f5faf8] px-2 py-2 text-center">
            <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#5a6a66]">Left</p>
            <p className="num text-[14px] font-extrabold text-[#61716d]">{left}</p>
          </div>
          <div className="border border-[#dbe6e8] bg-[#f5faf8] px-2 py-2 text-center">
            <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#5a6a66]">Target</p>
            <p className="num text-[14px] font-extrabold text-[#22312e]">{stats.totalGoal}</p>
          </div>
          <p className="col-span-3 text-center text-[9px] leading-relaxed text-sheet-muted">
            {monthLabel}: {stats.totalCompleted} of {stats.totalGoal} monthly target check-ins
          </p>
        </div>
      </div>
    </Card>
  );
}
