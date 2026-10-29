"use client";

import { useEffect } from "react";
import { LogoMark } from "@/components/Logo";
import { Icon } from "@/components/ui";

export function SideMenu({
  open,
  displayName,
  onToggle,
  onClose,
  onOpenSettings,
}: {
  open: boolean;
  displayName: string;
  onToggle: () => void;
  onClose: () => void;
  onOpenSettings: (section?: "space" | "backup" | "theme" | "custom") => void;
}) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const openSettings = () => {
    onClose();
    window.setTimeout(() => onOpenSettings(), 180);
  };

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        aria-controls="organizer-side-menu"
        className="no-print fixed left-3 top-3 z-[70] inline-flex h-10 w-10 items-center justify-center border border-sheet-teal-dark bg-sheet-teal text-white shadow-md transition-colors hover:bg-sheet-teal-dark focus:outline-none focus:ring-2 focus:ring-sheet-teal/30 sm:left-4 sm:top-4"
      >
        <span className="relative block h-4 w-5" aria-hidden="true">
          <span className={`absolute left-0 top-0 h-0.5 w-5 bg-current transition-transform duration-200 ${open ? "translate-y-[7px] rotate-45" : ""}`} />
          <span className={`absolute left-0 top-[7px] h-0.5 w-5 bg-current transition-opacity duration-200 ${open ? "opacity-0" : ""}`} />
          <span className={`absolute left-0 top-[14px] h-0.5 w-5 bg-current transition-transform duration-200 ${open ? "-translate-y-[7px] -rotate-45" : ""}`} />
        </span>
      </button>

      <div
        aria-hidden={!open}
        onClick={onClose}
        className={`no-print fixed inset-0 z-[55] bg-[#10211e]/45 backdrop-blur-[1px] transition-opacity duration-200 ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        id="organizer-side-menu"
        aria-label="Organizer navigation"
        aria-hidden={!open}
        className={`no-print fixed inset-y-0 left-0 z-[60] flex w-[284px] max-w-[84vw] flex-col border-r border-[#23574e] bg-[#f8fbfa] shadow-2xl transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="brand-gradient flex items-center gap-2.5 pb-5 pl-[66px] pr-4 pt-4 text-white">
          <LogoMark className="h-9 w-9 shrink-0 drop-shadow-sm" />
          <h2 className="mt-0.5 min-w-0 text-[19px] font-extrabold leading-tight tracking-tight">
            Life<span className="text-white/85">Space</span>
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="flex items-center gap-2.5 border border-[#cbdad6] bg-white px-2.5 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#c3d2d6] bg-[#f4faf8] text-[11px] font-bold text-sheet-teal-deep">
              {displayName.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11.5px] font-bold text-[#22312e]" title={displayName}>
                {displayName}
              </p>
              <p className="truncate text-[9px] text-sheet-muted">Progress saved on this device</p>
            </div>
          </div>

          <button
            type="button"
            tabIndex={open ? 0 : -1}
            onClick={openSettings}
            className="group mt-3 flex w-full items-center justify-center gap-1.5 border border-sheet-teal-dark bg-sheet-teal px-2.5 py-2 text-[11px] font-bold text-white transition-colors hover:bg-sheet-teal-dark focus:outline-none focus:ring-2 focus:ring-sheet-teal/30"
          >
            <Icon name="settings" className="h-3.5 w-3.5" />
            Settings
          </button>
        </div>

        <div className="border-t border-[#dbe6e3] bg-[#eff5f3] px-4 py-2.5 text-[9px] leading-relaxed text-sheet-muted">
          Tap the menu button again, press Escape, or tap anywhere outside this panel to close it.
        </div>
      </aside>
    </>
  );
}
