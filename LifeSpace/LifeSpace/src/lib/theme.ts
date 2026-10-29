"use client";

import { useSyncExternalStore } from "react";
import {
  ACCENT_PRESETS,
  BACKGROUND_PRESETS,
  DEFAULT_ACCENT,
  DEFAULT_INK_SWATCH,
  FONT_PRESETS,
  INK_PRESETS,
  SIZE_PRESETS,
  customDarkBackground,
  isHexColor,
  type TextSize,
  type ThemeMode,
} from "./appearance-presets";
import { DEFAULT_SPACE_THEME, isSpaceTheme, type SpaceTheme } from "./space-presets";

export {
  ACCENT_PRESETS,
  BACKGROUND_PRESETS,
  DEFAULT_INK_SWATCH,
  FONT_PRESETS,
  INK_PRESETS,
  SIZE_PRESETS,
  isHexColor,
};
export type { TextSize, ThemeMode };

export type Appearance = {
  mode: ThemeMode;
  accent: string;
  font: string;
  size: TextSize;
  ink: string;
  background: string;
  spaceTheme: SpaceTheme;
  spaceNameColor: string;
  spaceMotion: boolean;
};

export const APPEARANCE_STORAGE_KEY = "organizer-appearance";
export const LEGACY_THEME_KEY = "organizer-theme";

export const DEFAULT_APPEARANCE: Appearance = {
  mode: "light",
  accent: DEFAULT_ACCENT,
  font: "system",
  size: "md",
  ink: "default",
  background: "default",
  spaceTheme: DEFAULT_SPACE_THEME,
  spaceNameColor: "default",
  spaceMotion: true,
};

export function backgroundColors(value: string): { light: string; dark: string } | null {
  if (value === "default") return null;
  const preset = BACKGROUND_PRESETS.find((item) => item.value === value);
  if (preset) return { light: preset.light, dark: preset.dark };
  if (isHexColor(value)) return { light: value, dark: customDarkBackground(value) };
  return null;
}

function fontStack(value: string): string {
  return FONT_PRESETS.find((font) => font.value === value)?.stack ?? "";
}

function sizeZoom(value: TextSize): string {
  return SIZE_PRESETS.find((size) => size.value === value)?.zoom ?? "1";
}

function isMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

function sanitizeSize(value: unknown): TextSize {
  return value === "sm" || value === "md" || value === "lg" || value === "xl" ? value : "md";
}

export function readAppearance(): Appearance {
  if (typeof window === "undefined") return DEFAULT_APPEARANCE;
  try {
    const raw = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Appearance>) : {};

    let mode: ThemeMode = isMode(parsed.mode) ? parsed.mode : DEFAULT_APPEARANCE.mode;
    if (!raw) {
      const legacy = window.localStorage.getItem(LEGACY_THEME_KEY);
      if (isMode(legacy)) mode = legacy;
    }

    return {
      mode,
      accent: isHexColor(parsed.accent) ? parsed.accent : DEFAULT_ACCENT,
      font: FONT_PRESETS.some((font) => font.value === parsed.font)
        ? (parsed.font as string)
        : "system",
      size: sanitizeSize(parsed.size),
      ink: isHexColor(parsed.ink) ? parsed.ink : "default",
      background:
        typeof parsed.background === "string" &&
        (BACKGROUND_PRESETS.some((item) => item.value === parsed.background) ||
          isHexColor(parsed.background))
          ? parsed.background
          : "default",
      spaceTheme: isSpaceTheme(parsed.spaceTheme) ? parsed.spaceTheme : DEFAULT_SPACE_THEME,
      spaceNameColor: isHexColor(parsed.spaceNameColor) ? parsed.spaceNameColor : "default",
      spaceMotion: typeof parsed.spaceMotion === "boolean" ? parsed.spaceMotion : true,
    };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function applyAppearance(appearance: Appearance) {
  if (typeof window === "undefined") return;
  const root = document.documentElement;

  const dark =
    appearance.mode === "dark" ||
    (appearance.mode === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", dark);
  root.dataset.theme = appearance.mode;
  root.style.colorScheme = dark ? "dark" : "light";

  root.style.setProperty("--color-sheet-teal", appearance.accent);

  const stack = fontStack(appearance.font);
  if (stack) root.style.setProperty("--app-font", stack);
  else root.style.removeProperty("--app-font");

  root.style.setProperty("--app-zoom", sizeZoom(appearance.size));

  const bg = backgroundColors(appearance.background);
  if (bg) {
    root.style.setProperty("--app-bg-light", bg.light);
    root.style.setProperty("--app-bg-dark", bg.dark);
    root.classList.add("bg-custom");
  } else {
    root.style.removeProperty("--app-bg-light");
    root.style.removeProperty("--app-bg-dark");
    root.classList.remove("bg-custom");
  }

  if (isHexColor(appearance.ink)) {
    root.style.setProperty("--app-ink", appearance.ink);
    root.classList.add("ink-custom");
  } else {
    root.style.removeProperty("--app-ink");
    root.classList.remove("ink-custom");
  }

  root.dataset.spaceTheme = isSpaceTheme(appearance.spaceTheme)
    ? appearance.spaceTheme
    : DEFAULT_SPACE_THEME;
  root.dataset.spaceMotion = appearance.spaceMotion ? "on" : "off";
  if (isHexColor(appearance.spaceNameColor)) {
    root.style.setProperty("--app-space-name-color", appearance.spaceNameColor);
  } else {
    root.style.removeProperty("--app-space-name-color");
  }
}

let currentState: Appearance = DEFAULT_APPEARANCE;
let hydrated = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function persist(appearance: Appearance) {
  try {
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(appearance));
  } catch {
    // Storage may be unavailable (private mode); settings still apply this visit.
  }
}

export function updateAppearance(patch: Partial<Appearance>) {
  currentState = { ...currentState, ...patch };
  persist(currentState);
  applyAppearance(currentState);
  notify();
}

export function resetAppearance() {
  currentState = { ...DEFAULT_APPEARANCE };
  persist(currentState);
  applyAppearance(currentState);
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  if (!hydrated) {
    hydrated = true;
    currentState = readAppearance();
    applyAppearance(currentState);
    listener();
  }

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = () => {
    if (currentState.mode === "system") applyAppearance(currentState);
    listener();
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key !== APPEARANCE_STORAGE_KEY) return;
    currentState = readAppearance();
    applyAppearance(currentState);
    listener();
  };

  media.addEventListener("change", onSystemChange);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", onSystemChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function useAppearance(): {
  appearance: Appearance;
  update: (patch: Partial<Appearance>) => void;
  reset: () => void;
} {
  const appearance = useSyncExternalStore<Appearance>(
    subscribe,
    () => currentState,
    () => DEFAULT_APPEARANCE,
  );
  return { appearance, update: updateAppearance, reset: resetAppearance };
}

function subscribeResolvedDark(listener: () => void) {
  listeners.add(listener);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    if (currentState.mode === "system") applyAppearance(currentState);
    listener();
  };
  media.addEventListener("change", onChange);
  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", onChange);
  };
}

/** True while the dark theme is actually showing (including System → dark). */
export function useResolvedDark(): boolean {
  return useSyncExternalStore(
    subscribeResolvedDark,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );
}
