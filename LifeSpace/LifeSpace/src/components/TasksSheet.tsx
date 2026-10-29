"use client";

import { Card, Icon, SheetCheck } from "@/components/ui";
import type { SheetDay, SheetMonth } from "@/lib/dates";
import { WEEKDAY_SHORT } from "@/lib/dates";
import { completionKey, type SheetStats, type TaskStat } from "@/lib/stats";

const NAME_WIDTH = 196;
const GOAL_WIDTH = 50;

function dayCells(weekDays: SheetDay[]) {
  return Array.from({ length: 7 }, (_, weekday) => {
    const day = weekDays.find((candidate) => candidate.weekday === weekday);
    return day ?? null;
  });
}

export function TasksSheet({
  month,
  stats,
  done,
  today,
  selectedDate = today,
  pending,
  onToggle,
  onEdit,
  onAdd,
  onCheckAllToday,
  onClearMonth,
  checkAllDisabled,
}: {
  month: SheetMonth;
  stats: SheetStats;
  done: Set<string>;
  today: string;
  selectedDate?: string;
  pending: Set<string>;
  onToggle: (taskId: number, date: string, completed: boolean) => void;
  onEdit: (task: TaskStat) => void;
  onAdd: () => void;
  onCheckAllToday: () => void;
  onClearMonth: () => void;
  checkAllDisabled: boolean;
}) {
  const dayStats = new Map(stats.days.map((day) => [day.date, day]));
  const weekCount = month.weeks.length;
  const tableWidth = NAME_WIDTH + GOAL_WIDTH + weekCount * 7 * 26 + 44;

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-[#d7e3e0] bg-[#fbfdfc] px-3 py-1.5">
        <div className="flex items-baseline gap-2">
          <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-sheet-teal-dark">
            Task log
          </span>
          <span className="text-[9.5px] text-sheet-muted">
            {stats.activeTaskCount} active tasks · {month.daysInMonth} days ·{" "}
            {month.monthLabel} {month.year}
          </span>
        </div>
        <span className="no-print flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={onCheckAllToday}
            disabled={checkAllDisabled}
            title="Check every task for today"
            className="inline-flex h-[22px] items-center gap-1 border border-[#c3d2d6] bg-white px-2 text-[10px] font-semibold text-[#22312e] transition-colors hover:border-sheet-teal hover:text-sheet-teal-dark disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Icon name="check" className="h-3 w-3" />
            Check all today
          </button>
          <button
            type="button"
            onClick={onClearMonth}
            title="Clear every checkbox in this month"
            className="inline-flex h-[22px] items-center gap-1 border border-red-200 bg-white px-2 text-[10px] font-semibold text-red-700 transition-colors hover:border-red-400 hover:bg-red-50"
          >
            <Icon name="trash" className="h-3 w-3" />
            Clear month
          </button>
          <span className="mx-0.5 h-[18px] w-px bg-[#d7e3e0]" aria-hidden="true" />
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex h-[22px] items-center gap-1 border border-sheet-teal-dark bg-sheet-teal px-2 text-[10px] font-semibold text-white transition-colors hover:bg-sheet-teal-dark"
          >
            <Icon name="plus" className="h-3 w-3" />
            Add task
          </button>
        </span>
      </div>

      <div className="scroll-thin flex-1 overflow-x-auto">
        <table
          className="border-collapse text-[9.5px]"
          style={{ minWidth: tableWidth, width: "100%" }}
        >
          <colgroup>
            <col style={{ width: NAME_WIDTH }} />
            <col style={{ width: GOAL_WIDTH }} />
            {Array.from({ length: weekCount * 7 }, (_, index) => (
              <col key={`col-${index}`} style={{ width: 26 }} />
            ))}
            <col style={{ width: 44 }} />
          </colgroup>
          <thead>
            <tr>
              <th
                rowSpan={3}
                className="sheet-head-cell sticky left-0 z-30 px-3 text-left text-[16px] font-extrabold italic tracking-normal"
              >
                Tasks
              </th>
              <th
                rowSpan={3}
                className="sheet-head-cell sticky z-30 px-1 text-[9.5px] font-bold uppercase tracking-[0.1em]"
                style={{ left: NAME_WIDTH }}
              >
                Goal
              </th>
              {month.weeks.map((week) => (
                <th
                  key={week.label}
                  colSpan={7}
                  className="sheet-head-cell h-[25px] border-l border-[#2b6559] text-[9.5px] font-bold uppercase"
                >
                  {week.label}
                </th>
              ))}
              <th
                rowSpan={3}
                className="sheet-head-cell px-1 text-[8.5px] font-bold uppercase"
                title="Check-ins completed this month"
              >
                Σ
              </th>
            </tr>
            <tr>
              {month.weeks.map((week) => (
                <th
                  key={`wd-${week.index}`}
                  className="border-l border-[#c9d7d4] bg-[#e9efee] font-normal"
                  colSpan={7}
                >
                  <div className="grid grid-cols-7">
                    {WEEKDAY_SHORT.map((name) => (
                      <div
                        key={`${week.index}-${name}`}
                        className="py-[2px] text-center text-[7.5px] font-semibold text-[#54645f]"
                      >
                        {name}
                      </div>
                    ))}
                  </div>
                </th>
              ))}
            </tr>
            <tr>
              {month.weeks.map((week) => (
                <th
                  key={`dn-${week.index}`}
                  className="border-l border-[#c9d7d4] bg-[#f1f5f4] font-normal"
                  colSpan={7}
                >
                  <div className="grid grid-cols-7">
                    {dayCells(week.days).map((day, index) => (
                      <div
                        key={`${week.index}-slot-${index}`}
                        data-selected-date={day?.date === selectedDate ? day.date : undefined}
                        aria-current={day?.date === today ? "date" : undefined}
                        title={day ? `${day.date}${day.date === selectedDate ? " · Selected day" : ""}${day.date === today ? " · Today" : ""}` : undefined}
                        className={`num py-[1px] text-center text-[9px] font-bold ${
                          day?.date === selectedDate
                            ? "selected-day-column text-sheet-teal-deep"
                            : day?.date === today
                              ? "bg-[#cfe8e0] text-sheet-teal-deep"
                              : "text-[#33433f]"
                        }`}
                      >
                        {day ? day.day : ""}
                      </div>
                    ))}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.tasks.map((task) => (
              <tr key={task.id} className="group">
                <td
                  className="sticky left-0 z-20 border-b border-r border-[#e1eaec] bg-white px-2 py-[4px] group-hover:bg-[#f2f8f6]"
                  style={{ width: NAME_WIDTH }}
                >
                  <button
                    type="button"
                    onClick={() => onEdit(task)}
                    className="flex w-full items-center justify-between gap-1 text-left"
                    title="Rename, re-goal or delete this task"
                  >
                    <span
                      className={`truncate text-[10px] ${
                        task.goal === 0 ? "text-[#9aa9a5] line-through" : "font-medium text-[#22312e]"
                      }`}
                    >
                      {task.name}
                    </span>
                    <Icon
                      name="pencil"
                      className="h-2.5 w-2.5 shrink-0 text-[#9fb0ac] opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </button>
                </td>
                <td
                  className="num sticky z-20 border-b border-r border-[#e1eaec] bg-[#fbfdfc] px-1 py-[4px] text-center text-[9.5px] font-bold text-[#3a4a46] group-hover:bg-[#eef5f3]"
                  style={{ left: NAME_WIDTH }}
                >
                  {task.goal}
                </td>
                {month.weeks.map((week) => (
                  <td
                    key={`${task.id}-${week.index}`}
                    colSpan={7}
                    className="border-b border-l border-[#e1eaec] p-0"
                  >
                    <div className="grid grid-cols-7">
                      {dayCells(week.days).map((day, index) => {
                        if (!day) {
                          return (
                            <div
                              key={`${task.id}-${week.index}-blank-${index}`}
                              className="h-[25px] bg-[#fafcfc]"
                            />
                          );
                        }
                        const key = completionKey(task.id, day.date);
                        const checked = done.has(key);
                        const isPending = pending.has(key);
                        return (
                          <div
                            key={key}
                            className={`flex h-[25px] items-center justify-center border-r border-[#eef3f4] last:border-r-0 ${
                              day.date === selectedDate
                                ? "selected-day-column"
                                : day.date === today ? "bg-[#eaf5f1]" : ""
                            }`}
                          >
                            <SheetCheck
                              checked={checked}
                              disabled={isPending}
                              onToggle={() => onToggle(task.id, day.date, !checked)}
                              label={`${task.name} on ${day.date}`}
                              title={`${day.date} — ${checked ? "done, click to undo" : "click to check"}${
                                dayStats.get(day.date)
                                  ? ` · ${dayStats.get(day.date)?.completed}/${dayStats.get(day.date)?.goal} that day`
                                  : ""
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </td>
                ))}
                <td className="num border-b border-[#e1eaec] bg-[#fbfdfc] px-1 py-[4px] text-center text-[9.5px] font-bold text-[#23322f]">
                  {task.completed}
                </td>
              </tr>
            ))}
            {stats.tasks.length === 0 ? (
              <tr>
                <td
                  colSpan={weekCount * 7 + 3}
                  className="border-b border-[#e1eaec] px-4 py-6 text-center text-[10.5px] text-sheet-muted"
                >
                  This sheet has no tasks yet. Use{" "}
                  <button
                    type="button"
                    onClick={onAdd}
                    className="font-semibold text-sheet-teal-dark underline decoration-dotted"
                  >
                    Add task
                  </button>{" "}
                  to create your first habit row.
                </td>
              </tr>
            ) : null}
          </tbody>
          <tfoot>
            <tr>
              <td
                className="sticky left-0 z-20 border-r border-[#dbe6e8] bg-[#eef3f3] px-2 py-[3px] text-[8px] font-bold uppercase tracking-[0.12em] text-[#4b5b57]"
                style={{ width: NAME_WIDTH }}
              >
                Checked / day
              </td>
              <td
                className="sticky z-20 border-r border-[#dbe6e8] bg-[#eef3f3] px-1 py-[3px] text-center text-[8px] font-bold text-[#4b5b57]"
                style={{ left: NAME_WIDTH }}
              >
                {stats.dailyGoal}
              </td>
              {month.weeks.map((week) => (
                <td key={`total-${week.index}`} colSpan={7} className="border-l border-[#dbe6e8]">
                  <div className="grid grid-cols-7">
                    {dayCells(week.days).map((day, index) => (
                      <div
                        key={`total-${week.index}-${index}`}
                        className="num py-[3px] text-center text-[8.5px] font-bold text-[#2b3b37]"
                      >
                        {day ? dayStats.get(day.date)?.completed ?? 0 : ""}
                      </div>
                    ))}
                  </div>
                </td>
              ))}
              <td className="num bg-[#eef3f3] px-1 py-[3px] text-center text-[8.5px] font-bold text-[#2b3b37]">
                {stats.totalCompleted}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="no-print flex flex-wrap items-center justify-between gap-2 border-t border-[#e1eaec] bg-[#fbfdfc] px-3 py-1.5 text-[9px] text-sheet-muted">
        <span>
          Click any box to check it off. Every bar on this page recalculates instantly and is
          saved to PostgreSQL.
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <span className="sheet-check" data-checked="false" aria-hidden="true">
              <span>✓</span>
            </span>
            not done
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="sheet-check" data-checked="true" aria-hidden="true">
              <span>✓</span>
            </span>
            done
          </span>
        </span>
      </div>
    </Card>
  );
}
