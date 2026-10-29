"use client";

import { useState } from "react";
import type { DayStat } from "@/lib/stats";

const PLOT = { width: 760, height: 200, left: 34, right: 8, top: 12, bottom: 22 };

export function DailyAreaChart({
  days,
  chartMax,
  today,
}: {
  days: DayStat[];
  chartMax: number;
  today: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const plotWidth = PLOT.width - PLOT.left - PLOT.right;
  const plotHeight = PLOT.height - PLOT.top - PLOT.bottom;
  const count = Math.max(1, days.length);

  const pointFor = (day: DayStat, index: number) => {
    const x =
      days.length <= 1
        ? PLOT.left + plotWidth / 2
        : PLOT.left + (index / (count - 1)) * plotWidth;
    const ratio = chartMax > 0 ? Math.min(1, Math.max(0, day.pct / chartMax)) : 0;
    const y = PLOT.top + (1 - ratio) * plotHeight;
    return { x, y };
  };

  const coords = days.map(pointFor);
  const baseline = PLOT.top + plotHeight;
  const linePath = coords
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(" ");
  const areaPath =
    coords.length > 0
      ? `${linePath} L${coords[coords.length - 1].x.toFixed(2)},${baseline} L${coords[0].x.toFixed(2)},${baseline} Z`
      : "";

  const ticks = Array.from({ length: 5 }, (_, index) => (chartMax / 4) * index);
  const todayIndex = days.findIndex((day) => day.date === today);
  const hoveredDay = hovered !== null ? days[hovered] : null;
  const hoveredPoint = hovered !== null ? coords[hovered] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${PLOT.width} ${PLOT.height}`}
        className="block h-auto w-full"
        role="img"
        aria-label={`Daily completion chart for ${days.length} days. Peak ${Math.max(0, ...days.map((day) => day.pct)).toFixed(0)} percent.`}
      >
        <defs>
          <linearGradient id="dailyFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#79aeee" stopOpacity="0.7" />
            <stop offset="70%" stopColor="#bcd8f6" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#e3eefb" stopOpacity="0.25" />
          </linearGradient>
        </defs>

        {ticks.map((tick) => {
          const y = PLOT.top + (1 - tick / chartMax) * plotHeight;
          return (
            <g key={tick}>
              <line
                x1={PLOT.left}
                x2={PLOT.width - PLOT.right}
                y1={y}
                y2={y}
                stroke="#dbe5e7"
                className="chart-grid"
                strokeWidth={1}
              />
              <text
                x={PLOT.left - 6}
                y={y + 3}
                textAnchor="end"
                fontSize="9"
                fill="#6a7b77"
                className="chart-label"
              >
                {Math.round(tick)}%
              </text>
            </g>
          );
        })}

        <line
          x1={PLOT.left}
          x2={PLOT.width - PLOT.right}
          y1={baseline}
          y2={baseline}
          stroke="#9fb2b5"
          className="chart-axis"
          strokeWidth={1}
        />

        {areaPath ? <path d={areaPath} fill="url(#dailyFill)" /> : null}
        {linePath ? (
          <path
            d={linePath}
            fill="none"
            stroke="#2f77d4"
            strokeWidth={1.7}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}

        {todayIndex >= 0 && coords[todayIndex] ? (
          <g>
            <line
              x1={coords[todayIndex].x}
              x2={coords[todayIndex].x}
              y1={PLOT.top}
              y2={baseline}
              stroke="var(--color-sheet-teal)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <text
              x={Math.min(PLOT.width - PLOT.right - 22, Math.max(PLOT.left + 20, coords[todayIndex].x))}
              y={PLOT.top + 9}
              textAnchor="middle"
              fontSize="8.5"
              fill="#2a685d"
              className="chart-today"
              fontWeight="700"
            >
              TODAY
            </text>
          </g>
        ) : null}

        {coords.map((point, index) => {
          const day = days[index];
          const isToday = day.date === today;
          return (
            <g key={day.date}>
              <circle
                cx={point.x}
                cy={point.y}
                r={isToday ? 3.8 : 3.1}
                fill="#1f5fbf"
                stroke="#ffffff"
                strokeWidth={1.1}
              />
              <rect
                x={point.x - plotWidth / (count * 2)}
                y={PLOT.top}
                width={Math.max(6, plotWidth / count)}
                height={plotHeight}
                fill="transparent"
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(index)}
                onBlur={() => setHovered(null)}
                tabIndex={0}
                role="img"
                aria-label={`Day ${day.day}: ${day.completed} of ${day.goal} tasks, ${day.pct.toFixed(0)} percent`}
              />
            </g>
          );
        })}

        {days.map((day, index) => {
          const point = coords[index];
          if (!point) return null;
          const isToday = day.date === today;
          return (
            <text
              key={`label-${day.date}`}
              x={point.x}
              y={PLOT.height - 6}
              textAnchor="middle"
              fontSize="8"
              fontWeight={isToday ? 700 : 400}
              fill={isToday ? "#2a685d" : "#7a8a86"}
              className={isToday ? "chart-today" : "chart-label"}
            >
              {day.day}
            </text>
          );
        })}

        {hoveredDay && hoveredPoint ? (
          <g pointerEvents="none">
            <line
              x1={hoveredPoint.x}
              x2={hoveredPoint.x}
              y1={PLOT.top}
              y2={baseline}
              stroke="#2a685d"
              strokeWidth={0.8}
              strokeDasharray="2 3"
            />
            <rect
              x={Math.min(PLOT.width - PLOT.right - 82, Math.max(PLOT.left, hoveredPoint.x - 41))}
              y={Math.max(2, hoveredPoint.y - 30)}
              width={82}
              height={20}
              rx={2}
              fill="#173733"
              opacity={0.94}
            />
            <text
              x={Math.min(PLOT.width - PLOT.right - 82, Math.max(PLOT.left, hoveredPoint.x - 41)) + 41}
              y={Math.max(2, hoveredPoint.y - 30) + 13}
              textAnchor="middle"
              fontSize="9"
              fill="#ffffff"
            >
              {String(hoveredDay.day).padStart(2, "0")} · {hoveredDay.completed}/{hoveredDay.goal} ·{" "}
              {hoveredDay.pct.toFixed(0)}%
            </text>
          </g>
        ) : null}
      </svg>
    </div>
  );
}

export function DailyDonut({
  pctCompleted,
  completed,
  goal,
}: {
  pctCompleted: number;
  completed: number;
  goal: number;
}) {
  const pctLeft = Math.max(0, 100 - pctCompleted);
  const center = { x: 132, y: 88 };
  const radius = 54;
  const stroke = 24;
  const circumference = 2 * Math.PI * radius;
  const safePct = Math.min(100, Math.max(0, pctCompleted));
  const completedLength = (safePct / 100) * circumference;
  const pctLabel = `${safePct.toFixed(1)}%`;
  const leftLabel = `${pctLeft.toFixed(1)}%`;

  return (
    <div className="flex flex-1 items-center justify-center px-2">
      <svg
        viewBox="0 0 306 178"
        className="h-[168px] w-full max-w-[318px]"
        role="img"
        aria-label={`Monthly progress: ${completed} of ${goal} target days completed (${pctLabel}), ${leftLabel} left.`}
      >
        <circle
          cx={center.x}
          cy={center.y}
          r={radius}
          fill="none"
          stroke="#cfe1f5"
          className="donut-track"
          strokeWidth={stroke}
        />
        <circle
          cx={center.x}
          cy={center.y}
          r={radius}
          fill="none"
          stroke="#1f5cb8"
          className="donut-value"
          strokeWidth={stroke}
          strokeDasharray={`${completedLength} ${circumference - completedLength}`}
          strokeDashoffset={0}
          transform={`rotate(-90 ${center.x} ${center.y})`}
          strokeLinecap="butt"
        />
        <circle
          cx={center.x}
          cy={center.y}
          r={radius - stroke / 2 - 4}
          fill="none"
          stroke="#eef4fb"
          className="donut-ring"
          strokeWidth={1}
        />
        <text
          x={center.x}
          y={center.y + 2}
          textAnchor="middle"
          fontSize="21"
          fontWeight="700"
          fill="#173733"
          className="chart-strong"
        >
          {pctLabel}
        </text>
        <text
          x={center.x}
          y={center.y + 17}
          textAnchor="middle"
          fontSize="7.5"
          letterSpacing="1.2"
          fill="#6a7b77"
          className="chart-label"
        >
          COMPLETE
        </text>

        <polyline
          points={`${center.x + radius + 6},${center.y - 16} 236,${center.y - 30} 244,${center.y - 30}`}
          fill="none"
          stroke="#b8c7ca"
          className="chart-axis"
          strokeWidth={1}
        />
        <text x={248} y={center.y - 32} fontSize="8" fill="#4c5c58" letterSpacing="0.6" className="chart-label">
          COMPLETED
        </text>
        <text x={248} y={center.y - 21} fontSize="9.5" fontWeight="700" fill="#1f5cb8">
          {pctLabel}
        </text>

        <polyline
          points={`${center.x - radius - 6},${center.y + 20} 64,${center.y + 36} 58,${center.y + 36}`}
          fill="none"
          stroke="#b8c7ca"
          className="chart-axis"
          strokeWidth={1}
        />
        <text x={14} y={center.y + 40} fontSize="8" fill="#4c5c58" letterSpacing="0.6" className="chart-label">
          LEFT
        </text>
        <text x={14} y={center.y + 51} fontSize="9.5" fontWeight="700" fill="#7e93a8">
          {leftLabel}
        </text>
      </svg>
    </div>
  );
}
