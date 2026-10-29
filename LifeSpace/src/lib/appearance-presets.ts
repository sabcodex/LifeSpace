// Shared appearance data. This is a plain module (no "use client") so the client
// theme store and the server-rendered pre-paint script always use identical values.

export type ThemeMode = "light" | "dark" | "system";
export type TextSize = "sm" | "md" | "lg" | "xl";

export const DEFAULT_ACCENT = "#2f6fb0";
export const DEFAULT_INK_SWATCH = "#16211f";

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

/** How much of a custom background hue is kept when dark mode deepens it. */
export const CUSTOM_BG_DARK_STRENGTH = 22;
export const DARK_BASE = "#0b0f0e";

export function customDarkBackground(hex: string): string {
  return `color-mix(in srgb, ${hex} ${CUSTOM_BG_DARK_STRENGTH}%, ${DARK_BASE})`;
}

export type BackgroundPreset = {
  label: string;
  /** Optional label used while dark mode is active. */
  darkLabel?: string;
  value: string;
  /** Page background applied in light mode. */
  light: string;
  /** Page background applied in dark mode. */
  dark: string;
  /** Clearly visible color shown in the settings circle (light mode). */
  swatch: string;
  /** Clearly visible color shown in the settings circle (dark mode). */
  swatchDark: string;
};

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { label: "Default", value: "default", light: "#f2f6f5", dark: "#0f1615", swatch: "#9db5af", swatchDark: "#2c3d39" },
  { label: "Mint", value: "mint", light: "#dcf1e7", dark: "#0d2219", swatch: "#7fcaa8", swatchDark: "#1f6b4b" },
  { label: "Sky", value: "sky", light: "#e0ecfb", dark: "#0e1b2e", swatch: "#86b3f2", swatchDark: "#24497e" },
  { label: "Sand", value: "sand", light: "#f5ead6", dark: "#241d11", swatch: "#dcc28f", swatchDark: "#6b5427" },
  { label: "Lavender", value: "lavender", light: "#ede8fa", dark: "#1c1733", swatch: "#b3a4ee", swatchDark: "#4a3c8a" },
  { label: "Blush", value: "blush", light: "#fce6eb", dark: "#2b151d", swatch: "#f0a3b7", swatchDark: "#7a3048" },
  { label: "Peach", value: "peach", light: "#fde8da", dark: "#2c1b12", swatch: "#f7b48a", swatchDark: "#7d4122" },
  { label: "Lemon", value: "lemon", light: "#f9efc2", dark: "#26220d", swatch: "#ecd36a", swatchDark: "#6e5f17" },
  { label: "Stone", value: "stone", light: "#ecebe7", dark: "#1f1e1b", swatch: "#c2beb4", swatchDark: "#4d4a43" },
  {
    label: "Pure White",
    darkLabel: "Pure Black",
    value: "white",
    light: "#ffffff",
    dark: "#050707",
    swatch: "#ffffff",
    swatchDark: "#000000",
  },
];

export const ACCENT_PRESETS: Array<{ label: string; value: string }> = [
  { label: "Teal", value: "#3b8a7b" },
  { label: "Ocean", value: "#2f6fb0" },
  { label: "Indigo", value: "#5a57c4" },
  { label: "Violet", value: "#8a4fd0" },
  { label: "Rose", value: "#d0527e" },
  { label: "Amber", value: "#c9842a" },
  { label: "Emerald", value: "#2f9e6b" },
  { label: "Slate", value: "#4a5b6b" },
];

export const FONT_PRESETS: Array<{ label: string; value: string; stack: string }> = [
  { label: "System", value: "system", stack: "" },
  {
    label: "Grotesk",
    value: "grotesk",
    stack: `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
  },
  { label: "Serif", value: "serif", stack: `Georgia, Cambria, "Times New Roman", Times, serif` },
  {
    label: "Mono",
    value: "mono",
    stack: `ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace`,
  },
  {
    label: "Rounded",
    value: "rounded",
    stack: `"Trebuchet MS", "Segoe UI", ui-rounded, "Nunito", system-ui, sans-serif`,
  },
  {
    label: "Narrow",
    value: "narrow",
    stack: `"Arial Narrow", "Helvetica Neue", "Segoe UI", Arial, sans-serif`,
  },
];

export const SIZE_PRESETS: Array<{ label: string; value: TextSize; zoom: string }> = [
  { label: "Small", value: "sm", zoom: "0.9" },
  { label: "Default", value: "md", zoom: "1" },
  { label: "Large", value: "lg", zoom: "1.1" },
  { label: "X-Large", value: "xl", zoom: "1.2" },
];

/** Text colors: all dark enough to read on light backgrounds (lightened automatically in dark mode). */
export const INK_PRESETS: Array<{ label: string; value: string }> = [
  { label: "Default", value: "default" },
  { label: "Black", value: "#000000" },
  { label: "Charcoal", value: "#2b2f33" },
  { label: "Slate", value: "#334155" },
  { label: "Navy", value: "#1e3a8a" },
  { label: "Forest", value: "#166534" },
  { label: "Teal", value: "#115e59" },
  { label: "Plum", value: "#6b21a8" },
  { label: "Maroon", value: "#7f1d1d" },
  { label: "Brown", value: "#78350f" },
  { label: "Burnt Orange", value: "#9a3412" },
];
