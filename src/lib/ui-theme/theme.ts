/**
 * CLAUDE-UI-002 — UI System Foundation: theme runtime.
 *
 * Framework-agnostic logic for the new multi-palette `--ui-*` theme system.
 * Drives the `data-palette` / `data-mode` attributes on a scope element
 * (normally <html>), persists the visitor's choice, and resolves the
 * "system" mode preference to a concrete light/dark value.
 *
 * This is intentionally separate from the legacy `andacity-theme` /
 * `data-theme` (B1–B5) switcher, which still themes un-migrated production
 * pages via `--color-*`. The two systems coexist during the migration.
 */

export type PaletteId =
  | "skyglass"
  | "meridian"
  | "sandbar"
  | "sunset"
  | "alpine"
  | "midnight"
  | "baseline";

/** Resolved render mode applied to `data-mode`. */
export type ThemeMode = "light" | "dark";

/** Persisted mode preference (may defer to the OS via "system"). */
export type ModePreference = ThemeMode | "system";

export type PaletteMeta = {
  id: PaletteId;
  name: string;
  tagline: string;
  /** Swatch colors for the switcher (light-mode primary + accent). */
  swatch: { primary: string; accent: string; surface: string };
  logoCompat: "Very high" | "High" | "Acceptable" | "Needs refresh";
};

/**
 * Visitor-facing order. Skyglass is first (default); Meridian is the second
 * option / primary brand-native alternative.
 */
export const PALETTES: PaletteMeta[] = [
  {
    id: "skyglass",
    name: "Skyglass Luxe",
    tagline: "Cool, premium, legible.",
    swatch: { primary: "#1E6AE1", accent: "#38BDF8", surface: "#FFFFFF" },
    logoCompat: "Acceptable",
  },
  {
    id: "meridian",
    name: "Andacity Meridian",
    tagline: "Brand-native warmth.",
    swatch: { primary: "#0F766E", accent: "#F2A516", surface: "#FFFFFF" },
    logoCompat: "Very high",
  },
  {
    id: "sandbar",
    name: "Sandbar Editorial",
    tagline: "Quiet luxury, editorial.",
    swatch: { primary: "#0E7C73", accent: "#C4683C", surface: "#FFFFFF" },
    logoCompat: "High",
  },
  {
    id: "sunset",
    name: "Sunset Atlas",
    tagline: "Warm, aspirational.",
    swatch: { primary: "#FB5E3D", accent: "#7C3AED", surface: "#FFFFFF" },
    logoCompat: "Needs refresh",
  },
  {
    id: "alpine",
    name: "Alpine Signal",
    tagline: "Grounded, outdoors.",
    swatch: { primary: "#157A5B", accent: "#7FB7D9", surface: "#FFFFFF" },
    logoCompat: "Needs refresh",
  },
  {
    id: "midnight",
    name: "Midnight Terminal",
    tagline: "Cinematic night-travel.",
    swatch: { primary: "#4F86FF", accent: "#8B5CF6", surface: "#0B0E1A" },
    logoCompat: "Needs refresh",
  },
  {
    id: "baseline",
    name: "Baseline",
    tagline: "Typographic restraint.",
    swatch: { primary: "#1B1A13", accent: "#1B4FD1", surface: "#FFFFFF" },
    logoCompat: "Very high",
  },
];

export const PALETTE_IDS: PaletteId[] = PALETTES.map((p) => p.id);

export const DEFAULT_PALETTE: PaletteId = "skyglass";
/** Preserve the app's existing OS-preference behavior on first load. */
export const DEFAULT_MODE_PREFERENCE: ModePreference = "system";

export const PALETTE_STORAGE_KEY = "andacity-ui-palette";
export const MODE_STORAGE_KEY = "andacity-ui-mode";

export const isPaletteId = (value: unknown): value is PaletteId =>
  typeof value === "string" && (PALETTE_IDS as string[]).includes(value);

export const isModePreference = (value: unknown): value is ModePreference =>
  value === "light" || value === "dark" || value === "system";

/** Resolve a mode preference to a concrete render mode. */
export const resolveMode = (
  preference: ModePreference,
  prefersDark: boolean,
): ThemeMode => {
  if (preference === "system") return prefersDark ? "dark" : "light";
  return preference;
};

/**
 * Inline, render-blocking script that applies the stored UI theme before the
 * first paint (FOUC-safe). Kept dependency-free and defensive so a corrupt
 * value can never break the document. Mirrors the constants above; if those
 * change, update this string.
 */
export const UI_THEME_FOUC_SCRIPT = `(function(){try{
var p=localStorage.getItem('${PALETTE_STORAGE_KEY}');
var m=localStorage.getItem('${MODE_STORAGE_KEY}');
var ids=${JSON.stringify(PALETTE_IDS)};
if(ids.indexOf(p)===-1)p='${DEFAULT_PALETTE}';
if(m!=='light'&&m!=='dark'&&m!=='system')m='${DEFAULT_MODE_PREFERENCE}';
var dark=m==='dark'||(m==='system'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);
var el=document.documentElement;
el.setAttribute('data-palette',p);
el.setAttribute('data-mode',dark?'dark':'light');
}catch(e){}})();`;
