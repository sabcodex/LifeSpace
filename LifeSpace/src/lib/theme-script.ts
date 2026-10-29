// Server-safe: runs inline in <head> before paint so saved appearance never flashes.
// Lookup tables are generated from the shared presets so they always match the UI.
import {
  BACKGROUND_PRESETS,
  CUSTOM_BG_DARK_STRENGTH,
  DARK_BASE,
  FONT_PRESETS,
  SIZE_PRESETS,
} from "./appearance-presets";
import { SPACE_THEMES } from "./space-presets";

const BG_MAP: Record<string, [string, string]> = {};
for (const preset of BACKGROUND_PRESETS) {
  if (preset.value !== "default") BG_MAP[preset.value] = [preset.light, preset.dark];
}

const FONT_MAP: Record<string, string> = {};
for (const font of FONT_PRESETS) {
  if (font.stack) FONT_MAP[font.value] = font.stack;
}

const ZOOM_MAP: Record<string, string> = {};
for (const size of SIZE_PRESETS) ZOOM_MAP[size.value] = size.zoom;

export const THEME_INIT_SCRIPT = `(() => {
  try {
    var BG = ${JSON.stringify(BG_MAP)};
    var FONTS = ${JSON.stringify(FONT_MAP)};
    var ZOOM = ${JSON.stringify(ZOOM_MAP)};
    var HEX = /^#[0-9a-fA-F]{6}$/;
    var r = document.documentElement;
    var raw = localStorage.getItem('organizer-appearance');
    var a = raw ? JSON.parse(raw) : {};

    var mode = a.mode;
    if (mode !== 'light' && mode !== 'dark' && mode !== 'system') {
      var legacy = localStorage.getItem('organizer-theme');
      mode = (legacy === 'light' || legacy === 'dark' || legacy === 'system') ? legacy : 'light';
    }
    var dark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    r.classList.toggle('dark', dark);
    r.dataset.theme = mode;
    r.style.colorScheme = dark ? 'dark' : 'light';

    if (typeof a.accent === 'string' && HEX.test(a.accent)) r.style.setProperty('--color-sheet-teal', a.accent);
    if (a.font && FONTS[a.font]) r.style.setProperty('--app-font', FONTS[a.font]);
    r.style.setProperty('--app-zoom', ZOOM[a.size] || '1');

    var bg = null;
    if (typeof a.background === 'string') {
      if (BG[a.background]) bg = BG[a.background];
      else if (HEX.test(a.background)) bg = [a.background, 'color-mix(in srgb, ' + a.background + ' ${CUSTOM_BG_DARK_STRENGTH}%, ${DARK_BASE})'];
    }
    if (bg) {
      r.style.setProperty('--app-bg-light', bg[0]);
      r.style.setProperty('--app-bg-dark', bg[1]);
      r.classList.add('bg-custom');
    }

    if (typeof a.ink === 'string' && HEX.test(a.ink)) {
      r.style.setProperty('--app-ink', a.ink);
      r.classList.add('ink-custom');
    }

    var SPACES = ${JSON.stringify(SPACE_THEMES.map((theme) => theme.id))};
    r.dataset.spaceTheme = SPACES.indexOf(a.spaceTheme) !== -1 ? a.spaceTheme : 'galaxy';
    r.dataset.spaceMotion = a.spaceMotion === false ? 'off' : 'on';
    if (typeof a.spaceNameColor === 'string' && HEX.test(a.spaceNameColor)) {
      r.style.setProperty('--app-space-name-color', a.spaceNameColor);
    }
  } catch (e) {}
})();`;
