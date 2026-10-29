"use client";

import { useEffect } from "react";
import { LogoMark } from "@/components/Logo";
import { Icon } from "@/components/ui";

const MENU_ITEMS = [
  { id: "calendar", label: "Calendar", detail: "Daily progress and check-ins" },
  { id: "tasks", label: "Tasks Sheet", detail: "Edit tasks and check days" },
  { id: "guide", label: "Sheet Guide", detail: "How every panel works" },
] as const;

export type MenuUser = { name: string; email: string; avatarUrl: string | null };

export function SideMenu({
  open,
  user,
  guestName,
  signingOut,
  onSignOut,
  onToggle,
  onClose,
  onOpenSettings,
}: {
  open: boolean;
  user: MenuUser | null;
  guestName: string;
  signingOut: boolean;
  onSignOut: () => void;
  onToggle: () => void;
  onClose: () => void;
  onOpenSettings: (section?: "account" | "space" | "theme" | "custom") => void;
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

  const goTo = (id: string) => {
    onClose();
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 180);
  };

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
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/75">be productive</p>
            <h2 className="mt-0.5 text-[19px] font-extrabold leading-tight tracking-tight">
              Life<span className="text-white/85">Space</span>
            </h2>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-2 text-[9px] font-bold uppercase tracking-[0.18em] text-sheet-muted">Jump to section</p>
          <div className="space-y-1">
            {MENU_ITEMS.map((item, index) => (
              <button
                key={item.id}
                type="button"
                tabIndex={open ? 0 : -1}
                onClick={() => goTo(item.id)}
                className="group flex w-full items-center gap-3 border border-transparent px-2.5 py-2.5 text-left transition-colors hover:border-[#cbdad6] hover:bg-[#eaf4f1] focus:border-sheet-teal focus:bg-[#eaf4f1] focus:outline-none"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#b8ccc7] bg-white text-[10px] font-bold text-sheet-teal-dark group-hover:border-sheet-teal">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11.5px] font-bold text-[#22312e]">{item.label}</span>
                  <span className="block truncate text-[9px] text-sheet-muted">{item.detail}</span>
                </span>
                <Icon name="chevronRight" className="h-3.5 w-3.5 text-[#879793] transition-transform group-hover:translate-x-0.5 group-hover:text-sheet-teal-dark" />
              </button>
            ))}
          </div>
        </nav>

        <div className="border-t border-[#dbe6e3] px-3 py-3">
          <button
            type="button"
            tabIndex={open ? 0 : -1}
            onClick={openSettings}
            className="group flex w-full items-center gap-3 border border-transparent px-2.5 py-2.5 text-left transition-colors hover:border-[#cbdad6] hover:bg-[#eaf4f1] focus:border-sheet-teal focus:bg-[#eaf4f1] focus:outline-none"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#b8ccc7] bg-white text-sheet-teal-dark group-hover:border-sheet-teal">
              <Icon name="settings" className="h-3.5 w-3.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11.5px] font-bold text-[#22312e]">Settings</span>
              <span className="block truncate text-[9px] text-sheet-muted">Appearance &amp; preferences</span>
            </span>
            <Icon name="chevronRight" className="h-3.5 w-3.5 text-[#879793] transition-transform group-hover:translate-x-0.5 group-hover:text-sheet-teal-dark" />
          </button>
        </div>

        <div className="border-t border-[#dbe6e3] bg-[#f4faf8] px-3 py-2.5">
          {user ? (
            <>
              <div className="flex items-center gap-2">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded-full border border-[#c3d2d6] object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#c3d2d6] bg-white text-[11px] font-bold text-sheet-teal-deep">
                    {(user.name || user.email).slice(0, 2).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-bold text-[#22312e]">
                    {user.name || "Your account"}
                  </p>
                  <p className="truncate text-[9px] text-sheet-muted" title={user.email}>
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                tabIndex={open ? 0 : -1}
                onClick={onSignOut}
                disabled={signingOut}
                className="mt-2 flex w-full items-center justify-center gap-1.5 border border-[#c3d2d6] bg-white py-1.5 text-[10.5px] font-bold text-[#7f1d1d] transition-colors hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Icon name="logout" className="h-3 w-3" />
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-dashed border-[#b8ccc7] bg-white text-sheet-teal-dark">
                  <Icon name="user" className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-bold text-[#22312e]" title={guestName}>
                    {guestName}
                  </p>
                  <p className="truncate text-[9px] text-sheet-muted">
                    Progress saved on this device only
                  </p>
                </div>
              </div>
              <button
                type="button"
                tabIndex={open ? 0 : -1}
                onClick={() => {
                  onClose();
                  window.setTimeout(() => onOpenSettings("account"), 180);
                }}
                className="mt-2 flex w-full items-center justify-center gap-1.5 border border-sheet-teal-dark bg-sheet-teal py-1.5 text-[10.5px] font-bold text-white transition-colors hover:bg-sheet-teal-dark"
              >
                <Icon name="spark" className="h-3 w-3" />
                Sign in / Create account
              </button>
            </>
          )}
        </div>

        <div className="border-t border-[#dbe6e3] bg-[#eff5f3] px-4 py-2.5 text-[9px] leading-relaxed text-sheet-muted">
          Tap the menu button again, press Escape, or tap anywhere outside this panel to close it.
        </div>
      </aside>
    </>
  );
}
