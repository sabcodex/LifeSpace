"use client";

import { Card, ProgressBar, SheetHead } from "@/components/ui";
import { WEEKDAY_SHORT } from "@/lib/dates";
import type { SheetStats, WeekStat } from "@/lib/stats";

function weekCells(week: WeekStat) {
  return Array.from({ length: 7 }, (_, weekday) => {
    const day = week.days.find((candidate) => candidate.weekday === weekday);
    return day ?? null;
  });
}

export function WeeklyOverview({
  stats,
  today,
  monthLabel,
}: {
  stats: SheetStats;
  today: string;
  monthLabel: string;
}) {
  const columns = `72px repeat(${Math.max(1, stats.weeks.length)}, minmax(148px, 1fr))`;
  const barMax = Math.max(stats.chartMax, 20);

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      {/* Calendar overview header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d8e3e6] bg-[#fbfdfc] px-3 py-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-sheet-teal-dark">
            Calendar overview
          </span>
          <span className="text-[9.5px] text-sheet-muted">
            {monthLabel} · checked boxes per day
          </span>
        </div>
        <span className="num text-[9.5px] font-semibold text-sheet-muted">
          {stats.totalCompleted}/{stats.totalGoal} check-ins · {stats.totalPct.toFixed(0)}%
        </span>
      </div>

      <div className="scroll-thin flex-1 overflow-x-auto">
        <div className="min-w-[820px]">
          <div className="grid" style={{ gridTemplateColumns: columns }}>
            <div className="sheet-head h-[26px] text-[8.5px] font-bold uppercase" />
            {stats.weeks.map((week) => (
              <div
                key={`head-${week.index}`}
                className="sheet-head h-[26px] border-l border-[#2b6559] text-[10px] font-bold uppercase"
              >
                {week.label}
              </div>
            ))}

            <div className="flex items-center justify-end border-b border-r border-[#dbe6e8] bg-[#f6f9f9] px-2 text-[8px] font-semibold uppercase tracking-[0.1em] text-[#71817d]">
              Days
            </div>
            {stats.weeks.map((week) => (
              <div
                key={`weekdays-${week.index}`}
                className="grid grid-cols-7 border-b border-r border-[#dbe6e8] last:border-r-0"
              >
                {WEEKDAY_SHORT.map((name) => (
                  <div
                    key={`${week.index}-${name}`}
                    className="py-[3px] text-center text-[8px] font-semibold text-[#647571]"
                  >
                    {name}
                  </div>
                ))}
              </div>
            ))}

            <div className="flex items-center justify-end border-b border-r border-[#dbe6e8] bg-[#f6f9f9] px-2 text-[8px] font-semibold uppercase tracking-[0.1em] text-[#71817d]">
              Date
            </div>
            {stats.weeks.map((week) => (
              <div
                key={`dates-${week.index}`}
                className="grid grid-cols-7 border-b border-r border-[#dbe6e8] last:border-r-0"
              >
                {weekCells(week).map((day, index) => (
                  <div
                    key={`${week.index}-date-${index}`}
                    className={`num py-[2px] text-center text-[9px] ${
                      day?.date === today
                        ? "bg-[#dcefe9] font-bold text-sheet-teal-deep"
                        : "text-[#3d4d49]"
                    }`}
                  >
                    {day ? day.day : ""}
                  </div>
                ))}
              </div>
            ))}

            <div className="flex items-end justify-end border-b border-r border-[#dbe6e8] bg-[#f6f9f9] px-2 pb-1 text-[8px] font-semibold uppercase tracking-[0.1em] text-[#71817d]">
              Rate
            </div>
            {stats.weeks.map((week) => (
              <div
                key={`bars-${week.index}`}
                className="grid grid-cols-7 items-end gap-[3px] border-b border-r border-[#dbe6e8] px-1 pb-1 pt-2 last:border-r-0"
                style={{ height: 66 }}
              >
                {weekCells(week).map((day, index) => {
                  const height = day && day.goal > 0 ? Math.max(2, (day.completed / barMax) * 46) : 0;
                  return (
                    <div key={`${week.index}-bar-${index}`} className="flex justify-center">
                      <div
                        title={day ? `${day.completed}/${day.goal} done` : undefined}
                        className={`w-full max-w-[16px] transition-[height] duration-500 ${
                          day?.date === today ? "bg-sheet-blue-deep" : "bg-[#5a94e0]"
                        }`}
                        style={{ height }}
                      />
                    </div>
                  );
                })}
              </div>
            ))}

            <div className="flex items-center justify-end border-b border-r border-[#dbe6e8] bg-[#f6f9f9] px-2 text-[8px] font-semibold uppercase tracking-[0.1em] text-[#71817d]">
              Done
            </div>
            {stats.weeks.map((week) => (
              <div
                key={`done-${week.index}`}
                className="grid grid-cols-7 border-b border-r border-[#dbe6e8] bg-[#f3f7fb] last:border-r-0"
              >
                {weekCells(week).map((day, index) => (
                  <div
                    key={`${week.index}-done-${index}`}
                    className="num py-[2px] text-center text-[9px] text-[#23322f]"
                  >
                    {day ? day.completed : ""}
                  </div>
                ))}
              </div>
            ))}

            <div className="flex items-center justify-end border-b border-r border-[#dbe6e8] bg-[#f6f9f9] px-2 text-[8px] font-semibold uppercase tracking-[0.1em] text-[#71817d]">
              Goal
            </div>
            {stats.weeks.map((week) => (
              <div
                key={`goal-${week.index}`}
                className="grid grid-cols-7 border-b border-r border-[#dbe6e8] last:border-r-0"
              >
                {weekCells(week).map((day, index) => (
                  <div
                    key={`${week.index}-goal-${index}`}
                    className="num py-[2px] text-center text-[9px] text-[#4d5d59]"
                  >
                    {day ? day.goal : ""}
                  </div>
                ))}
              </div>
            ))}

            <div className="flex items-center justify-end border-b border-r border-[#dbe6e8] bg-[#f6f9f9] px-2 text-[8px] font-semibold uppercase tracking-[0.1em] text-[#71817d]">
              Left
            </div>
            {stats.weeks.map((week) => (
              <div
                key={`left-${week.index}`}
                className="grid grid-cols-7 border-b border-r border-[#dbe6e8] last:border-r-0"
              >
                {weekCells(week).map((day, index) => (
                  <div
                    key={`${week.index}-left-${index}`}
                    className="num py-[2px] text-center text-[9px] text-[#4d5d59]"
                  >
                    {day ? day.left : ""}
                  </div>
                ))}
              </div>
            ))}

            {/* Weekly Progress section under the Calendar Overview */}
            <div className="flex items-center justify-end border-b border-r border-[#dbe6e8] bg-[#eef5f3] px-2 text-[8px] font-bold uppercase tracking-[0.08em] text-[#2f554d]">
              Weekly Progress
            </div>
            {stats.weeks.map((week) => (
              <div
                key={`ratio-${week.index}`}
                className="num border-b border-r border-[#dbe6e8] bg-[#f5faf8] py-[3px] text-center text-[9px] font-bold text-[#2c3c38] last:border-r-0"
              >
                {week.completed}/{week.goal}
              </div>
            ))}

            <div className="flex items-center justify-end border-b border-r border-[#dbe6e8] bg-[#eef5f3] px-2 text-[8px] font-bold uppercase tracking-[0.08em] text-[#2f554d]">
              Rate
            </div>
            {stats.weeks.map((week) => (
              <div
                key={`pct-${week.index}`}
                className="num border-b border-r border-[#dbe6e8] bg-[#f5faf8] py-[3px] text-center text-[9px] font-bold text-sheet-blue-deep last:border-r-0"
              >
                {week.pct.toFixed(0)}%
              </div>
            ))}

            <div className="flex items-center justify-end border-r border-[#dbe6e8] bg-[#eef5f3] px-2 py-1 text-[8px] font-bold uppercase tracking-[0.08em] text-[#2f554d]">
              Bar
            </div>
            {stats.weeks.map((week) => (
              <div
                key={`weekbar-${week.index}`}
                className="border-r border-[#dbe6e8] bg-[#f5faf8] px-2 py-1.5 last:border-r-0"
              >
                <ProgressBar value={week.pct} height={9} barClassName="bg-sheet-blue-deep" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-[#e1eaec] bg-[#fbfdfc] px-3 py-2">
        <span className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-[#5a6a66]">
          Month total
        </span>
        <div className="flex min-w-[140px] flex-1 items-center gap-2">
          <ProgressBar value={stats.totalPct} height={9} className="max-w-[240px]" />
          <span className="num text-[9.5px] font-bold text-[#22312e]">
            {stats.totalCompleted}/{stats.totalGoal} · {stats.totalPct.toFixed(0)}%
          </span>
        </div>
        <span className="text-[8.5px] text-sheet-muted">
          {stats.dailyGoal} check-ins/day target
        </span>
      </div>
    </Card>
  );
}
