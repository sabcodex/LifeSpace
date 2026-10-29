"use client";

import { useEffect, useState } from "react";
import { AuthForm } from "@/components/AuthForm";
import { SpaceSettings } from "@/components/SpaceSettings";
import { Icon, type IconName } from "@/components/ui";
import {
  ACCENT_PRESETS,
  BACKGROUND_PRESETS,
  DEFAULT_INK_SWATCH,
  FONT_PRESETS,
  INK_PRESETS,
  SIZE_PRESETS,
  isHexColor,
  useAppearance,
  useResolvedDark,
  type ThemeMode,
} from "@/lib/theme";

type SettingsSection = "account" | "space" | "theme" | "custom";

export type SettingsUser = { name: string; email: string; avatarUrl: string | null; provider: string };

const SECTIONS: Array<{
  id: SettingsSection;
  label: string;
  detail: string;
  icon: IconName;
}> = [
  {
    id: "account",
    label: "Account",
    detail: "Sign in to save your progress",
    icon: "user",
  },
  {
    id: "space",
    label: "Your Space",
    detail: "Your name, colors and moving sky",
    icon: "spark",
  },
  {
    id: "theme",
    label: "System Theme",
    detail: "Light, dark, or automatic",
    icon: "monitor",
  },
  {
    id: "custom",
    label: "Custom Colors & Styling",
    detail: "Accent, background, font, size",
    icon: "spark",
  },
];

const THEME_OPTIONS: Array<{
  value: ThemeMode;
  label: string;
  tagline: string;
  detail: string;
  icon: IconName;
}> = [
  {
    value: "light",
    label: "White / Light",
    tagline: "Clean, high-contrast light theme",
    detail: "Crisp white cards on a soft background, matching the original spreadsheet style.",
    icon: "sun",
  },
  {
    value: "dark",
    label: "Dark",
    tagline: "Deep, eye-friendly dark theme",
    detail: "Dark surfaces across every card, table, chart and dialog for comfortable viewing.",
    icon: "moon",
  },
  {
    value: "system",
    label: "System",
    tagline: "Sync with your device setting",
    detail:
      "Automatically switches between Light and Dark based on your device or browser preference.",
    icon: "monitor",
  },
];

const FONT_SAMPLE_STYLE: Record<string, string> = {
  system: "",
  grotesk: "ui-sans-serif, system-ui, sans-serif",
  serif: "Georgia, serif",
  mono: "ui-monospace, Menlo, monospace",
  rounded: '"Trebuchet MS", sans-serif',
  narrow: '"Arial Narrow", Arial, sans-serif',
};

/** Shown on a "Custom" picker until the user chooses their own color. */
const RAINBOW =
  "conic-gradient(from 0deg, #ef4444, #f59e0b, #eab308, #22c55e, #06b6d4, #3b82f6, #8b5cf6, #ec4899, #ef4444)";

/** Neutral outline so every circle stays visible on both light and dark surfaces. */
const SWATCH_OUTLINE = "0 0 0 1px rgba(128, 128, 128, 0.55)";

function Swatch({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      className="h-5 w-5 shrink-0 rounded-full"
      style={{ background: color, boxShadow: SWATCH_OUTLINE }}
    />
  );
}

const PILL_BASE =
  "relative flex items-center gap-2 rounded-full border-2 bg-white py-1 pl-1 pr-3 text-[10.5px] font-semibold transition-colors";
const PILL_ACTIVE = "border-[#22312e] text-[#1f2d2a] shadow-sm ring-2 ring-sheet-teal/40";
const PILL_IDLE = "border-[#cbdad6] text-[#41514d] hover:border-sheet-teal";

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: IconName;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="sheet-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[#dfe8ea] bg-[#fbfdfc] px-4 py-3">
        <Icon name={icon} className="h-4 w-4 text-sheet-teal-dark" />
        <h2 className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#22312e]">{title}</h2>
      </div>
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}

export function SettingsPage({
  open,
  onClose,
  user,
  displayName,
  onSaveName,
  googleConfigured,
  initialSection,
}: {
  open: boolean;
  onClose: () => void;
  user: SettingsUser | null;
  displayName: string;
  onSaveName: (name: string) => Promise<void>;
  googleConfigured: boolean;
  initialSection?: SettingsSection;
}) {
  const { appearance, update, reset } = useAppearance();
  const isDark = useResolvedDark();
  const [section, setSection] = useState<SettingsSection | null>(initialSection ?? null);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Even if the request fails, return to the guest sheet.
    }
    window.location.href = "/";
  };

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (section) setSection(null);
        else onClose();
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, section]);

  if (!open) return null;

  const accentIsPreset = ACCENT_PRESETS.some(
    (preset) => preset.value.toLowerCase() === appearance.accent.toLowerCase(),
  );
  const inkIsPreset = INK_PRESETS.some((preset) => preset.value === appearance.ink);
  const bgIsPreset = BACKGROUND_PRESETS.some((preset) => preset.value === appearance.background);
  const activeSection = SECTIONS.find((item) => item.id === section);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-page-title"
      className="sheet-paper no-print fixed inset-0 z-[80] flex flex-col"
    >
      <div className="brand-gradient flex items-center justify-between gap-3 px-4 py-3.5 text-white shadow-md sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back to sheet"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-white/40 text-white transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            <Icon name="chevronLeft" className="h-4 w-4" />
          </button>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/75">Settings</p>
            <h1 id="settings-page-title" className="text-[17px] font-bold leading-tight">
              Settings
            </h1>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 items-center gap-1.5 border border-white/40 px-3 text-[11px] font-semibold text-white transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40"
        >
          <Icon name="check" className="h-3.5 w-3.5" />
          Done
        </button>
      </div>

      <div className="scroll-thin flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-[860px] sm:grid sm:grid-cols-[240px_minmax(0,1fr)] sm:items-start sm:gap-4">
          {/* Settings list */}
          <div className={`${section === null ? "block" : "hidden"} sm:block`}>
            <section className="sheet-card overflow-hidden">
              <div className="border-b border-[#dfe8ea] bg-[#fbfdfc] px-4 py-3">
                <h2 className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#22312e]">
                  Preferences
                </h2>
              </div>
              <div className="space-y-1.5 p-2">
                {SECTIONS.map((item) => {
                  const active = section === item.id;
                  const detail =
                    item.id === "account"
                      ? user
                        ? `Signed in as ${user.email}`
                        : "Sign in to save your progress"
                      : item.detail;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSection(item.id)}
                      aria-current={active ? "true" : undefined}
                      className={`flex w-full items-center gap-3 border px-2.5 py-2.5 text-left transition-colors ${
                        active
                          ? "border-sheet-teal-dark bg-[#eaf4f1]"
                          : "border-transparent hover:border-[#cbdad6] hover:bg-[#f2f8f6]"
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center border ${
                          active
                            ? "border-sheet-teal-dark bg-sheet-teal text-white"
                            : "border-[#b8ccc7] bg-white text-sheet-teal-dark"
                        }`}
                      >
                        <Icon name={item.icon} className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11.5px] font-bold text-[#22312e]">
                          {item.label}
                        </span>
                        <span className="block truncate text-[9px] text-sheet-muted">
                          {detail}
                        </span>
                      </span>
                      <Icon
                        name="chevronRight"
                        className="h-3.5 w-3.5 text-[#879793] sm:hidden"
                      />
                    </button>
                  );
                })}
              </div>
              <div className="border-t border-[#dfe8ea] bg-[#f7faf9] px-4 py-2.5 text-[9px] leading-relaxed text-sheet-muted">
                Appearance preferences stay on this device. Account names sync when signed in.
              </div>
            </section>
          </div>

          {/* Section content */}
          <div className={`${section === null ? "hidden sm:block" : "block"} min-w-0`}>
            {activeSection ? (
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSection(null)}
                    aria-label="Back to the settings list"
                    className="inline-flex h-7 w-7 items-center justify-center border border-[#cbdad6] bg-white text-[#41514d] transition-colors hover:border-sheet-teal hover:text-sheet-teal-dark sm:hidden"
                  >
                    <Icon name="chevronLeft" className="h-3.5 w-3.5" />
                  </button>
                  <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#22312e]">
                    {activeSection.label}
                  </h2>
                </div>
                {section === "custom" ? (
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex items-center gap-1.5 border border-[#cbdad6] bg-white px-2.5 py-1 text-[10.5px] font-semibold text-[#41514d] transition-colors hover:border-red-300 hover:text-red-700"
                  >
                    <Icon name="trash" className="h-3 w-3" />
                    Reset
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="sheet-card hidden px-5 py-8 text-center sm:block">
                <Icon name="settings" className="mx-auto h-6 w-6 text-[#9fb0ac]" />
                <p className="mt-2 text-[11.5px] font-semibold text-[#22312e]">
                  Choose a section
                </p>
                <p className="mt-1 text-[10.5px] text-sheet-muted">
                  Pick Account, Your Space, System Theme or Custom Colors &amp; Styling to see its options.
                </p>
              </div>
            )}

            {section === "space" ? (
              <SpaceSettings
                displayName={displayName}
                isGuest={!user}
                onSaveName={onSaveName}
                onOpenTheme={() => setSection("theme")}
              />
            ) : null}

            {section === "account" ? (
              <div className="space-y-4">
                {user ? (
                  <>
                    <section className="sheet-card overflow-hidden">
                      <div className="flex items-center gap-2 border-b border-[#dfe8ea] bg-[#fbfdfc] px-4 py-3">
                        <Icon name="user" className="h-4 w-4 text-sheet-teal-dark" />
                        <h2 className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#22312e]">
                          Signed in
                        </h2>
                      </div>
                      <div className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {user.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={user.avatarUrl}
                              alt=""
                              className="h-12 w-12 shrink-0 rounded-full border border-[#c3d2d6] object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#c3d2d6] bg-[#eaf4f1] text-[15px] font-bold text-sheet-teal-deep">
                              {(user.name || user.email).slice(0, 2).toUpperCase()}
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-bold text-[#22312e]">
                              {user.name || "Your account"}
                            </p>
                            <p className="truncate text-[10.5px] text-sheet-muted" title={user.email}>
                              {user.email}
                            </p>
                            <span className="mt-1 inline-flex items-center gap-1 border border-[#cbdad6] bg-white px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.1em] text-[#41514d]">
                              {user.provider === "google" ? "Google account" : "Email & password"}
                            </span>
                          </div>
                        </div>
                        <p className="mt-3 text-[10.5px] leading-relaxed text-sheet-muted">
                          Your tasks, goals and check-ins are saved to this account automatically and
                          sync on every device you sign in from.
                        </p>
                        <button
                          type="button"
                          onClick={() => setSection("space")}
                          className="mt-3 mr-2 inline-flex items-center gap-1.5 border border-sheet-teal-dark bg-sheet-teal px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-sheet-teal-dark"
                        >
                          <Icon name="spark" className="h-3.5 w-3.5" />
                          Edit name &amp; space
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleSignOut()}
                          disabled={signingOut}
                          className="mt-3 inline-flex items-center gap-1.5 border border-[#c3d2d6] bg-white px-3 py-1.5 text-[11px] font-bold text-[#7f1d1d] transition-colors hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Icon name="logout" className="h-3.5 w-3.5" />
                          {signingOut ? "Signing out…" : "Sign out"}
                        </button>
                      </div>
                    </section>
                  </>
                ) : (
                  <>
                    <section className="sheet-card overflow-hidden">
                      <div className="flex items-center gap-2 border-b border-[#dfe8ea] bg-[#fbfdfc] px-4 py-3">
                        <Icon name="spark" className="h-4 w-4 text-sheet-teal-dark" />
                        <h2 className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#22312e]">
                          Save your progress
                        </h2>
                      </div>
                      <div className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fbf1de] text-[#9a6a14]">
                            <Icon name="bell" className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-bold text-[#22312e]">
                              You&apos;re using a guest sheet
                            </p>
                            <p className="mt-1 text-[10.5px] leading-relaxed text-sheet-muted">
                              Everything works right now, but your progress lives on this device only.
                              Create a free account and your whole sheet — tasks, goals and every
                              checkmark — moves into your account automatically.
                            </p>
                          </div>
                        </div>
                        <ul className="mt-3 space-y-1.5 text-[10.5px] text-[#41514d]">
                          {[
                            "Never lose a check-in — it's saved to your account",
                            "Sync the same sheet on your phone and computer",
                            "Private to you: nobody else can see your tasks",
                          ].map((benefit) => (
                            <li key={benefit} className="flex items-center gap-2">
                              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#e2f2ec] text-sheet-teal-dark">
                                <Icon name="check" className="h-2.5 w-2.5" />
                              </span>
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </section>

                    <AuthForm
                      compact
                      googleConfigured={googleConfigured}
                      onSuccess={() => {
                        window.location.href = "/";
                      }}
                    />
                  </>
                )}
              </div>
            ) : null}

            {section === "theme" ? (
              <section className="sheet-card overflow-hidden">
                <div className="border-b border-[#dfe8ea] bg-[#fbfdfc] px-4 py-3">
                  <p className="text-[11px] text-sheet-muted">
                    Applies to the whole website: every card, table, menu, bar and chart.
                  </p>
                </div>
                <div className="space-y-2.5 p-4" role="radiogroup" aria-label="System Theme">
                  {THEME_OPTIONS.map((option) => {
                    const active = appearance.mode === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => update({ mode: option.value })}
                        className={`group flex w-full items-start gap-3.5 border p-3.5 text-left transition-all ${
                          active
                            ? "border-sheet-teal-dark bg-[#eaf4f1] shadow-sm ring-1 ring-sheet-teal/40"
                            : "border-[#cbdad6] bg-white hover:border-[#a0b5b0] hover:bg-[#fafcfc]"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors ${
                            active
                              ? "border-sheet-teal-dark bg-sheet-teal text-white"
                              : "border-[#cbdad6] bg-[#f5f8f7] text-[#556964] group-hover:border-sheet-teal group-hover:text-sheet-teal-dark"
                          }`}
                        >
                          <Icon name={option.icon} className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[13px] font-bold text-[#1f2d2a]">
                              {option.label}
                            </span>
                            {active ? (
                              <span className="inline-flex items-center gap-1 rounded border border-sheet-teal-dark/30 bg-sheet-teal/15 px-2 py-0.5 text-[10px] font-bold text-sheet-teal-deep">
                                <Icon name="check" className="h-3 w-3" />
                                Active
                              </span>
                            ) : null}
                          </div>
                          <p className="text-[11px] font-semibold text-sheet-teal-dark">
                            {option.tagline}
                          </p>
                          <p className="mt-1 text-[10.5px] leading-relaxed text-sheet-muted">
                            {option.detail}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {section === "custom" ? (
              <div className="space-y-4">
                <SectionCard icon="spark" title="Accent Color">
                  <p className="mb-3 text-[11px] leading-relaxed text-sheet-muted">
                    Changes headers, buttons, progress bars, and check highlights across the sheet.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {ACCENT_PRESETS.map((preset) => {
                      const active =
                        appearance.accent.toLowerCase() === preset.value.toLowerCase();
                      return (
                        <button
                          key={preset.value}
                          type="button"
                          aria-label={`Accent ${preset.label}`}
                          aria-pressed={active}
                          title={preset.label}
                          onClick={() => update({ accent: preset.value })}
                          className={`relative h-9 w-9 rounded-full border-2 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            active
                              ? "border-[#22312e] ring-2 ring-sheet-teal/50"
                              : "border-white"
                          }`}
                          style={{ backgroundColor: preset.value }}
                        >
                          {active ? (
                            <Icon
                              name="check"
                              className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow"
                            />
                          ) : null}
                        </button>
                      );
                    })}
                    <label
                      className={`relative flex h-9 cursor-pointer items-center gap-2 rounded-full border-2 px-3 text-[10.5px] font-semibold transition-colors ${
                        accentIsPreset
                          ? "border-[#cbdad6] bg-white text-[#41514d]"
                          : "border-[#22312e] bg-white text-[#22312e] ring-2 ring-sheet-teal/40"
                      }`}
                      title="Pick a custom accent color"
                    >
                      <Swatch color={accentIsPreset ? RAINBOW : appearance.accent} />
                      Custom
                      <input
                        type="color"
                        value={appearance.accent}
                        onChange={(event) => update({ accent: event.target.value })}
                        className="absolute inset-0 cursor-pointer opacity-0"
                        aria-label="Custom accent color"
                      />
                    </label>
                  </div>
                </SectionCard>

                <SectionCard icon="calendar" title="Background Color">
                  <p className="mb-3 text-[11px] leading-relaxed text-sheet-muted">
                    Sets the background color of the whole website. Every color has its own light
                    and dark shade, so it follows the theme automatically.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {BACKGROUND_PRESETS.map((preset) => {
                      const active = appearance.background === preset.value;
                      const label = isDark && preset.darkLabel ? preset.darkLabel : preset.label;
                      return (
                        <button
                          key={preset.value}
                          type="button"
                          aria-pressed={active}
                          title={`${label} background`}
                          onClick={() => update({ background: preset.value })}
                          className={`${PILL_BASE} ${active ? PILL_ACTIVE : PILL_IDLE}`}
                        >
                          <Swatch color={isDark ? preset.swatchDark : preset.swatch} />
                          {label}
                        </button>
                      );
                    })}
                    <label
                      className={`${PILL_BASE} cursor-pointer ${bgIsPreset ? PILL_IDLE : PILL_ACTIVE}`}
                      title="Pick a custom background color"
                    >
                      <Swatch color={bgIsPreset ? RAINBOW : appearance.background} />
                      Custom
                      <input
                        type="color"
                        value={isHexColor(appearance.background) ? appearance.background : "#f2f6f5"}
                        onChange={(event) => update({ background: event.target.value })}
                        className="absolute inset-0 cursor-pointer opacity-0"
                        aria-label="Custom background color"
                      />
                    </label>
                  </div>
                  <p className="mt-3 text-[9.5px] leading-relaxed text-sheet-muted">
                    A custom color is used exactly in light mode and automatically deepened in dark
                    mode so text stays readable.
                  </p>
                </SectionCard>

                <SectionCard icon="pencil" title="Font">
                  <p className="mb-3 text-[11px] leading-relaxed text-sheet-muted">
                    Choose the font family used across the organizer sheet.
                  </p>
                  <div
                    role="radiogroup"
                    aria-label="Font family"
                    className="grid grid-cols-2 gap-2 sm:grid-cols-3"
                  >
                    {FONT_PRESETS.map((font) => {
                      const active = appearance.font === font.value;
                      return (
                        <button
                          key={font.value}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => update({ font: font.value })}
                          className={`settings-theme-option flex flex-col items-start gap-1 border px-3 py-3 text-left transition-colors ${
                            active ? "settings-theme-option-active" : "border-[#cbdad6] bg-white"
                          }`}
                        >
                          <span className="text-[11.5px] font-bold">{font.label}</span>
                          <span
                            className="text-[13px] leading-none"
                            style={{ fontFamily: FONT_SAMPLE_STYLE[font.value] || undefined }}
                          >
                            Ag 123
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </SectionCard>

                <SectionCard icon="plus" title="Text Size & Scaling">
                  <p className="mb-3 text-[11px] leading-relaxed text-sheet-muted">
                    Scale everything on the sheet up or down for comfortable viewing.
                  </p>
                  <div role="radiogroup" aria-label="Text size" className="grid grid-cols-4 gap-2">
                    {SIZE_PRESETS.map((size) => {
                      const active = appearance.size === size.value;
                      return (
                        <button
                          key={size.value}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => update({ size: size.value })}
                          className={`settings-theme-option flex flex-col items-center gap-1 border px-2 py-3 text-center transition-colors ${
                            active ? "settings-theme-option-active" : "border-[#cbdad6] bg-white"
                          }`}
                        >
                          <span
                            className="font-bold leading-none"
                            style={{ fontSize: `${Number(size.zoom) * 13}px` }}
                          >
                            A
                          </span>
                          <span className="text-[10px] font-semibold">{size.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </SectionCard>

                <SectionCard icon="sun" title="Text Color">
                  <p className="mb-3 text-[11px] leading-relaxed text-sheet-muted">
                    Changes the main text color across the sheet. &quot;Default&quot; keeps the
                    theme&apos;s built-in text colors.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {INK_PRESETS.map((preset) => {
                      const active = appearance.ink === preset.value;
                      const swatch =
                        preset.value === "default"
                          ? isDark
                            ? "linear-gradient(135deg,#dde7e4 50%,#94a7a2 50%)"
                            : "linear-gradient(135deg,#16211f 50%,#5d6d69 50%)"
                          : preset.value;
                      return (
                        <button
                          key={preset.value}
                          type="button"
                          aria-pressed={active}
                          title={`${preset.label} text`}
                          onClick={() => update({ ink: preset.value })}
                          className={`${PILL_BASE} ${active ? PILL_ACTIVE : PILL_IDLE}`}
                        >
                          <Swatch color={swatch} />
                          {preset.label}
                        </button>
                      );
                    })}
                    <label
                      className={`${PILL_BASE} cursor-pointer ${inkIsPreset ? PILL_IDLE : PILL_ACTIVE}`}
                      title="Pick a custom text color"
                    >
                      <Swatch color={inkIsPreset ? RAINBOW : appearance.ink} />
                      Custom
                      <input
                        type="color"
                        value={isHexColor(appearance.ink) ? appearance.ink : DEFAULT_INK_SWATCH}
                        onChange={(event) => update({ ink: event.target.value })}
                        className="absolute inset-0 cursor-pointer opacity-0"
                        aria-label="Custom text color"
                      />
                    </label>
                  </div>
                  <p className="mt-3 text-[9.5px] leading-relaxed text-sheet-muted">
                    In dark mode, text colors are automatically lightened so they stay readable.
                  </p>
                </SectionCard>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
