import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";

const THEMES = [
  { id: "b1", name: "Sky Blue",     primary: "#2563EB" },
  { id: "b2", name: "Ocean Teal",   primary: "#0F766E" },
  { id: "b3", name: "Night Navy",   primary: "#1E3A8A" },
  { id: "b4", name: "Desert Sand",  primary: "#B45309" },
  { id: "b5", name: "Atlas Indigo", primary: "#4F46E5" },
] as const;

type ThemeId = (typeof THEMES)[number]["id"];

const STORAGE_KEY = "andacity-theme";
const DEFAULT_THEME: ThemeId = "b1";

function applyTheme(id: ThemeId) {
  if (id === DEFAULT_THEME) {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = id;
  }
}

export const ThemeSwitcher = component$(() => {
  const active = useSignal<ThemeId>(DEFAULT_THEME);

  useVisibleTask$(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    const valid = THEMES.some((t) => t.id === stored);
    const initial: ThemeId = valid ? (stored as ThemeId) : DEFAULT_THEME;
    active.value = initial;
    applyTheme(initial);
  });

  return (
    <div
      role="group"
      aria-label="Color theme"
      class="flex items-center gap-1 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-panel)] px-2 py-1.5"
    >
      {THEMES.map((theme) => {
        const isActive = active.value === theme.id;
        return (
          <button
            key={theme.id}
            type="button"
            title={`${theme.name} theme`}
            aria-label={`${theme.name} theme`}
            aria-pressed={isActive ? "true" : "false"}
            class={[
              "size-3.5 rounded-full transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--color-ring)]",
              isActive
                ? "scale-125 ring-2 ring-offset-1 ring-[color:var(--color-ring)]"
                : "opacity-50 hover:opacity-100 hover:scale-110",
            ]}
            style={{ backgroundColor: theme.primary }}
            onClick$={() => {
              active.value = theme.id;
              applyTheme(theme.id);
              localStorage.setItem(STORAGE_KEY, theme.id);
            }}
          />
        );
      })}
    </div>
  );
});
