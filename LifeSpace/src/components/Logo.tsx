import { useId } from "react";

/**
 * LifeSpace brand mark: a deep-space badge with an orbit ring (your space),
 * a small planet, and a check mark (be productive — tasks done).
 */
export function LogoMark({ className = "h-10 w-10" }: { className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const gradientId = `lifespace-g-${id}`;
  const glowId = `lifespace-glow-${id}`;

  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="LifeSpace logo">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2f6fb0" />
          <stop offset="55%" stopColor="#4f6fd0" />
          <stop offset="100%" stopColor="#7b4ab6" />
        </linearGradient>
        <radialGradient id={glowId} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="2.5" y="2.5" width="43" height="43" rx="13" fill={`url(#${gradientId})`} />
      <rect x="2.5" y="2.5" width="43" height="43" rx="13" fill={`url(#${glowId})`} />
      <ellipse
        cx="24"
        cy="25"
        rx="14.5"
        ry="8.2"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.2"
        opacity="0.9"
        transform="rotate(-24 24 25)"
      />
      <path
        d="M17.5 25.2 L22.4 30 L30.8 20.4"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="35.6" cy="15.8" r="3" fill="#ffd166" />
      <circle
        cx="35.6"
        cy="15.8"
        r="4.6"
        fill="none"
        stroke="#ffd166"
        strokeWidth="1.2"
        opacity="0.55"
      />
      <circle cx="13.2" cy="13.4" r="1.3" fill="#ffffff" opacity="0.9" />
    </svg>
  );
}

/**
 * Full lockup: mark + "LifeSpace" wordmark + "be productive" tagline.
 * Text inherits color from the parent via `currentColor`-friendly classes.
 */
export function Logo({
  markClassName = "h-11 w-11",
  titleClassName = "text-sheet-ink",
  taglineClassName = "text-sheet-muted",
  tagline = "be productive",
}: {
  markClassName?: string;
  titleClassName?: string;
  taglineClassName?: string;
  tagline?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark className={`${markClassName} shrink-0 drop-shadow-sm`} />
      <span className="flex min-w-0 flex-col leading-none">
        <span className={`text-[22px] font-extrabold tracking-tight ${titleClassName}`}>
          Life<span className="text-sheet-teal">Space</span>
        </span>
        <span
          className={`mt-1 text-[9px] font-bold uppercase tracking-[0.3em] ${taglineClassName}`}
        >
          {tagline}
        </span>
      </span>
    </span>
  );
}
