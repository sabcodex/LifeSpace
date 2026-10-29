import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`sheet-card ${className}`}>{children}</section>;
}

export function SheetHead({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`sheet-head ${className}`}>{children}</div>;
}

export function ProgressBar({
  value,
  className = "",
  barClassName = "bg-sheet-blue",
  height = 10,
  label,
}: {
  value: number;
  className?: string;
  barClassName?: string;
  height?: number;
  label?: string;
}) {
  const width = Math.max(0, Math.min(100, value));
  return (
    <div
      className={`w-full overflow-hidden border border-[#b9c9cd] bg-white ${className}`}
      style={{ height }}
      role="img"
      aria-label={label ?? `${width.toFixed(0)} percent complete`}
    >
      <div
        className={`h-full transition-[width] duration-500 ease-out ${barClassName}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export function SheetCheck({
  checked,
  onToggle,
  label,
  disabled = false,
  title,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      title={title ?? label}
      disabled={disabled}
      onClick={onToggle}
      data-checked={checked}
      className="sheet-check align-middle disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span aria-hidden="true">✓</span>
    </button>
  );
}

export function Blank() {
  return <span className="text-[#b3c0bd]">—</span>;
}

export function IconButton({
  children,
  onClick,
  label,
  disabled = false,
  tone = "plain",
  className = "",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  label: string;
  disabled?: boolean;
  tone?: "plain" | "teal" | "danger";
  className?: string;
  type?: "button" | "submit";
}) {
  const tones: Record<string, string> = {
    plain:
      "border-[#c3d2d6] bg-white text-sheet-ink hover:border-sheet-teal hover:text-sheet-teal-dark",
    teal: "border-sheet-teal-dark bg-sheet-teal text-white hover:bg-sheet-teal-dark",
    danger: "border-red-200 bg-white text-red-700 hover:border-red-400 hover:bg-red-50",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
      className={`inline-flex h-7 items-center justify-center gap-1.5 border px-2 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${tones[tone]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Icon({ name, className = "h-3.5 w-3.5" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

export type IconName =
  | "chevronLeft"
  | "chevronRight"
  | "plus"
  | "pencil"
  | "arrowUp"
  | "arrowDown"
  | "trash"
  | "download"
  | "printer"
  | "calendar"
  | "close"
  | "check"
  | "spark"
  | "sun"
  | "moon"
  | "monitor"
  | "settings"
  | "bell"
  | "user"
  | "logout";

const ICON_PATHS: Record<IconName, ReactNode> = {
  chevronLeft: <path d="M15 18l-6-6 6-6" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  pencil: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />,
  arrowUp: <path d="M12 19V5M5 12l7-7 7 7" />,
  arrowDown: <path d="M12 5v14M19 12l-7 7-7-7" />,
  trash: <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />,
  download: <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />,
  printer: (
    <>
      <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
      <path d="M6 14h12v8H6z" />
    </>
  ),
  calendar: <path d="M3 4h18v18H3zM8 2v4M16 2v4M3 10h18" />,
  close: <path d="M18 6L6 18M6 6l12 12" />,
  check: <path d="M20 6L9 17l-5-5" />,
  spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />,
  monitor: <path d="M3 4h18v12H3zM8 20h8M12 16v4" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 01-3.4 0" />
    </>
  ),
  user: (
    <>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
};

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sheet-muted">
      {children}
    </span>
  );
}
