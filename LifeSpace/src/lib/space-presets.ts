export type SpaceTheme = "galaxy" | "aurora" | "nebula" | "sunrise";

export const DEFAULT_SPACE_THEME: SpaceTheme = "galaxy";

export const SPACE_THEMES: Array<{
  id: SpaceTheme;
  label: string;
  description: string;
  preview: string;
}> = [
  {
    id: "galaxy",
    label: "Galaxy",
    description: "Blue twilight and quiet stars",
    preview: "linear-gradient(135deg, #9fc9e2 4%, #315476 60%, #18283e 100%)",
  },
  {
    id: "aurora",
    label: "Aurora",
    description: "A soft emerald horizon",
    preview: "linear-gradient(135deg, #86caba 4%, #276f70 55%, #143544 100%)",
  },
  {
    id: "nebula",
    label: "Nebula",
    description: "Violet clouds and rose light",
    preview: "linear-gradient(135deg, #c8a7df 4%, #7a5ca1 55%, #322b5d 100%)",
  },
  {
    id: "sunrise",
    label: "Sunrise",
    description: "Peach skies and golden glow",
    preview: "linear-gradient(135deg, #ffe3b1 4%, #edac9c 55%, #976482 100%)",
  },
];

/** Display-name colours are auto-lightened by CSS when the site is in dark mode. */
export const SPACE_NAME_COLORS: Array<{ name: string; value: string }> = [
  { name: "Automatic", value: "default" },
  { name: "Teal", value: "#127c79" },
  { name: "Ocean", value: "#266fbb" },
  { name: "Amethyst", value: "#7b4ab6" },
  { name: "Rose", value: "#b83876" },
  { name: "Gold", value: "#986619" },
];

export function isSpaceTheme(value: unknown): value is SpaceTheme {
  return SPACE_THEMES.some((theme) => theme.id === value);
}
