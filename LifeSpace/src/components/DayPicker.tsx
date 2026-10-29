"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { formatFullDate, WEEKDAY_LONG, WEEKDAY_SHORT, type SheetDay, type SheetMonth } from "@/lib/dates";
import { Icon } from "@/components/ui";

/** Selects a day within the month chosen in Calendar Settings, never another month. */
export function DayPicker({
  id,
  month,
  selectedDate,
  today,
  onSelect,
  onClose,
}: {
  id: string;
  month: SheetMonth;
  selectedDate: string;
  today: string;
  onSelect: (day: number) => void;
  onClose: () => void;
}) {
  const selectedDay = month.days.find((day) => day.date === selectedDate)?.day ?? 1;
  const [focusedDay, setFocusedDay] = useState(selectedDay);
  const buttons = useRef(new Map<number, HTMLButtonElement>());

  useEffect(() => {
    buttons.current.get(selectedDay)?.focus({ preventScroll: true });
  }, [selectedDay]);

  function moveFocus(event: KeyboardEvent<HTMLButtonElement>, day: SheetDay) {
    let target: number;
    switch (event.key) {
      case "ArrowLeft": target = day.day - 1; break;
      case "ArrowRight": target = day.day + 1; break;
      case "ArrowUp": target = day.day - 7; break;
      case "ArrowDown": target = day.day + 7; break;
      case "Home": target = day.day - day.weekday; break;
      case "End": target = day.day + (6 - day.weekday); break;
      default: return;
    }
    event.preventDefault();
    target = Math.max(1, Math.min(month.daysInMonth, target));
    setFocusedDay(target);
    buttons.current.get(target)?.focus({ preventScroll: true });
  }

  return (
    <div
      id={id}
      role="dialog"
      aria-modal="false"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-help`}
      className="day-picker no-print absolute left-0 top-[calc(100%+8px)] z-[50] w-full overflow-hidden rounded-sm border shadow-xl"
    >
      <div className="flex items-center justify-between gap-2 border-b border-inherit px-3 py-2.5">
        <div>
          <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-sheet-muted">
            Choose a day
          </p>
          <h2 id={`${id}-title`} className="mt-0.5 text-[12px] font-bold">
            {month.monthLabel} {month.year}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close day picker"
          className="day-picker-close flex h-7 w-7 items-center justify-center rounded-sm text-sheet-muted"
        >
          <Icon name="close" className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="px-2 pb-2 pt-1.5">
        <table role="grid" aria-label={`Days in ${month.monthLabel} ${month.year}`} className="w-full table-fixed border-separate border-spacing-0">
          <thead>
            <tr>
              {WEEKDAY_SHORT.map((label, index) => (
                <th key={label} scope="col" aria-label={WEEKDAY_LONG[index]} className="h-7 text-center text-[9px] font-semibold text-sheet-muted">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {month.weeks.map((week) => (
              <tr key={week.index}>
                {WEEKDAY_SHORT.map((label, weekday) => {
                  const day = week.days.find((candidate) => candidate.weekday === weekday);
                  if (!day) return <td key={label} className="p-0.5" />;
                  const selected = day.date === selectedDate;
                  const isToday = day.date === today;
                  return (
                    <td key={label} aria-selected={selected} className="p-0.5">
                      <button
                        type="button"
                        ref={(node) => {
                          if (node) buttons.current.set(day.day, node);
                          else buttons.current.delete(day.day);
                        }}
                        tabIndex={focusedDay === day.day ? 0 : -1}
                        aria-label={formatFullDate(day.date)}
                        aria-pressed={selected}
                        aria-current={isToday ? "date" : undefined}
                        title={`${formatFullDate(day.date)}${isToday ? " · Today" : ""}`}
                        onFocus={() => setFocusedDay(day.day)}
                        onKeyDown={(event) => moveFocus(event, day)}
                        onClick={() => onSelect(day.day)}
                        data-selected={selected}
                        data-today={isToday}
                        className="day-picker-day num relative flex h-8 w-full items-center justify-center rounded-sm text-[11px] font-semibold"
                      >
                        {day.day}
                        {isToday ? <span aria-hidden="true" className="absolute bottom-0.5 h-[3px] w-[3px] rounded-full bg-current" /> : null}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p id={`${id}-help`} className="border-t border-inherit px-3 py-2 text-[9px] leading-relaxed text-sheet-muted">
        Month and year follow Calendar Settings.
      </p>
    </div>
  );
}
