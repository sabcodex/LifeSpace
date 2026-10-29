"use client";

import { Icon } from "@/components/ui";

const STARS = Array.from({ length: 33 }, (_, index) => ({
  left: `${(index * 73 + 17) % 99}%`,
  top: `${(index * 41 + 11) % 94}%`,
  size: index % 9 === 0 ? 3 : index % 3 === 0 ? 2 : 1,
  delay: `${((index * 11) % 35) / -10}s`,
  duration: `${2.6 + (index % 5) * 0.7}s`,
}));

export function SpaceBanner({
  displayName,
  onCustomize,
  preview = false,
}: {
  displayName: string;
  onCustomize?: () => void;
  preview?: boolean;
}) {
  return (
    <section
      data-space-banner
      aria-label="Your personalized space"
      className={`sheet-card space-banner relative isolate w-full min-w-0 overflow-hidden ${
        preview ? "space-banner-preview h-[140px]" : "h-[248px]"
      }`}
    >
      <div aria-hidden="true" className="space-glow pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="space-stars pointer-events-none absolute inset-0">
        {STARS.map((star, index) => (
          <span
            key={index}
            className="space-star absolute rounded-full"
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              animationDelay: star.delay,
              animationDuration: star.duration,
            }}
          />
        ))}
      </div>
      <div aria-hidden="true" className="space-orbit space-orbit-outer pointer-events-none absolute" />
      <div aria-hidden="true" className="space-orbit space-orbit-inner pointer-events-none absolute" />
      <div aria-hidden="true" className="space-planet pointer-events-none absolute" />
      <div aria-hidden="true" className="space-comet pointer-events-none absolute" />

      <div className={`relative z-10 flex h-full flex-col justify-between ${preview ? "px-5 py-3.5" : "px-5 py-4 sm:px-8 lg:px-10"}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="space-eyebrow inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.17em]">
            <span aria-hidden="true" className="space-indicator h-1.5 w-1.5 rounded-full" />
            Your space
          </div>
          <span className="space-small-label whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.19em]">
            Make it yours <span aria-hidden="true">✦</span>
          </span>
        </div>

        <div className="space-content max-w-[78%] min-w-0">
          <p className="space-small-label mb-1 text-[10px] font-medium tracking-[0.07em]">
            A little universe for
          </p>
          <h2
            data-space-name
            title={displayName}
            className="space-name max-w-full break-words font-extrabold leading-[1.08] tracking-[-0.045em]"
          >
            {displayName}
          </h2>
          <p className="space-small-label mt-1.5 text-[10.5px] font-medium tracking-[0.05em]">
            One day at a time, make it count.
          </p>
        </div>

        <div className="flex min-h-[20px] items-end justify-between gap-3">
          <span className="space-small-label text-[9px] font-semibold uppercase tracking-[0.14em]">
            ✦&nbsp; Every day begins here
          </span>
          {onCustomize ? (
            <button
              type="button"
              onClick={onCustomize}
              className="space-personalize inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[9.5px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <Icon name="spark" className="h-3 w-3" />
              Personalize
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
