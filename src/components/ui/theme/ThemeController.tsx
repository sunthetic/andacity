/**
 * CLAUDE-UI-002 — Visitor-facing theme switcher (palette + light/dark).
 *
 * Polished, accessible control for the new `--ui-*` theme system. Skyglass
 * Luxe is presented first (default); Andacity Meridian second. Every palette
 * supports Light / Dark / Auto (system). Choice persists across reloads and is
 * applied to <html> via `data-palette` / `data-mode`. Keyboard + screen-reader
 * accessible and mobile-friendly.
 *
 * Reusable in the site shell; demonstrated live in /dev/ui-palettes.
 */
import { $, component$, useOnDocument, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import {
  DEFAULT_MODE_PREFERENCE,
  DEFAULT_PALETTE,
  MODE_STORAGE_KEY,
  PALETTES,
  PALETTE_STORAGE_KEY,
  isModePreference,
  isPaletteId,
  resolveMode,
  type ModePreference,
  type PaletteId,
} from "~/lib/ui-theme/theme";

const MODE_OPTIONS: { id: ModePreference; label: string; icon: string }[] = [
  { id: "light", label: "Light", icon: "☀" },
  { id: "dark", label: "Dark", icon: "☾" },
  { id: "system", label: "Auto", icon: "◐" },
];

const prefersDark = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const applyTheme = (palette: PaletteId, mode: ModePreference) => {
  const el = document.documentElement;
  el.setAttribute("data-palette", palette);
  el.setAttribute("data-mode", resolveMode(mode, prefersDark()));
};

export const ThemeController = component$((props: { align?: "left" | "right" }) => {
  const open = useSignal(false);
  const palette = useSignal<PaletteId>(DEFAULT_PALETTE);
  const modePref = useSignal<ModePreference>(DEFAULT_MODE_PREFERENCE);

  // Initialize from storage + keep "Auto" in sync with the OS.
  useVisibleTask$(({ cleanup }) => {
    const storedPalette = localStorage.getItem(PALETTE_STORAGE_KEY);
    const storedMode = localStorage.getItem(MODE_STORAGE_KEY);
    if (isPaletteId(storedPalette)) palette.value = storedPalette;
    if (isModePreference(storedMode)) modePref.value = storedMode;
    applyTheme(palette.value, modePref.value);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (modePref.value === "system") applyTheme(palette.value, modePref.value);
    };
    mq.addEventListener("change", onChange);
    cleanup(() => mq.removeEventListener("change", onChange));
  });

  useOnDocument(
    "keydown",
    $((event: KeyboardEvent) => {
      if (event.key === "Escape") open.value = false;
    }),
  );

  const selectPalette = $((id: PaletteId) => {
    palette.value = id;
    localStorage.setItem(PALETTE_STORAGE_KEY, id);
    applyTheme(id, modePref.value);
  });

  const selectMode = $((id: ModePreference) => {
    modePref.value = id;
    localStorage.setItem(MODE_STORAGE_KEY, id);
    applyTheme(palette.value, id);
  });

  const active = PALETTES.find((p) => p.id === palette.value) ?? PALETTES[0];
  const activeMode = MODE_OPTIONS.find((m) => m.id === modePref.value) ?? MODE_OPTIONS[0];

  return (
    <div class="relative inline-block text-left">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open.value}
        aria-label={`Theme: ${active.name}, ${activeMode.label}. Change theme`}
        onClick$={() => (open.value = !open.value)}
        class="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2"
        style="background:var(--ui-surface);border-color:var(--ui-border);color:var(--ui-text);box-shadow:var(--ui-shadow-card)"
      >
        <span class="flex -space-x-1" aria-hidden="true">
          <span class="size-3.5 rounded-full ring-1 ring-black/10" style={`background:${active.swatch.primary}`} />
          <span class="size-3.5 rounded-full ring-1 ring-black/10" style={`background:${active.swatch.accent}`} />
        </span>
        <span class="hidden sm:inline">{active.name}</span>
        <span aria-hidden="true" style="color:var(--ui-text-muted)">{activeMode.icon}</span>
      </button>

      {open.value ? (
        <>
          {/* click-away backdrop */}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            class="fixed inset-0 z-40 cursor-default"
            onClick$={() => (open.value = false)}
          />

          <div
            role="dialog"
            aria-label="Choose a theme"
            class={[
              "absolute z-50 mt-2 w-72 overflow-hidden rounded-2xl border p-3",
              props.align === "right" ? "right-0" : "left-0",
            ]}
            style="background:var(--ui-surface);border-color:var(--ui-border);box-shadow:var(--ui-shadow-panel)"
          >
            <p class="px-1 text-[11px] font-bold uppercase tracking-[0.12em]" style="color:var(--ui-text-muted)">
              Color theme
            </p>

            <div role="radiogroup" aria-label="Palette" class="mt-2 grid gap-1">
              {PALETTES.map((p) => {
                const isActive = p.id === palette.value;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    onClick$={() => selectPalette(p.id)}
                    class="flex items-center gap-3 rounded-xl px-2 py-2 text-left transition focus:outline-none focus-visible:ring-2"
                    style={
                      isActive
                        ? "background:var(--ui-surface-muted)"
                        : "background:transparent"
                    }
                  >
                    <span class="flex -space-x-1.5" aria-hidden="true">
                      <span class="size-5 rounded-full ring-1 ring-black/10" style={`background:${p.swatch.primary}`} />
                      <span class="size-5 rounded-full ring-1 ring-black/10" style={`background:${p.swatch.accent}`} />
                    </span>
                    <span class="min-w-0 flex-1">
                      <span class="block text-sm font-semibold" style="color:var(--ui-text)">
                        {p.name}
                      </span>
                      <span class="block text-[11px]" style="color:var(--ui-text-muted)">
                        {p.tagline}
                      </span>
                    </span>
                    {isActive ? (
                      <span aria-hidden="true" class="text-sm font-bold" style={`color:${p.swatch.primary}`}>
                        ✓
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <p class="mt-3 px-1 text-[11px] font-bold uppercase tracking-[0.12em]" style="color:var(--ui-text-muted)">
              Appearance
            </p>
            <div
              role="radiogroup"
              aria-label="Appearance mode"
              class="mt-2 grid grid-cols-3 gap-1 rounded-xl p-1"
              style="background:var(--ui-surface-muted)"
            >
              {MODE_OPTIONS.map((m) => {
                const isActive = m.id === modePref.value;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    onClick$={() => selectMode(m.id)}
                    class="flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-semibold transition focus:outline-none focus-visible:ring-2"
                    style={
                      isActive
                        ? "background:var(--ui-primary);color:var(--ui-on-primary)"
                        : "background:transparent;color:var(--ui-text-secondary)"
                    }
                  >
                    <span aria-hidden="true">{m.icon}</span>
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
});
