/**
 * CLAUDE-UI-003 — Global shell sample: forced-mobile composition.
 *
 * DEV / DESIGN-SAMPLE ONLY. Renders the mobile shell layout independent of the
 * viewport breakpoints so it can be shown inside a phone frame at any screen
 * size. `open` statically renders the menu sheet (absolute within the frame, so
 * it stays inside the phone outline). Consumes `--ui-*`.
 */
import { component$ } from "@builder.io/qwik";
import { Brand } from "~/components/dev/shell/SampleHeader";
import { PRIMARY_NAV, SHELL_TRUST } from "~/components/dev/shell/nav";

const Search = component$(() => (
  <svg viewBox="0 0 24 24" class="size-4" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
    <path d="m20 20-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  </svg>
));

/** Static theme indicator (the live ThemeController lives in the page header). */
const ThemeChip = component$(() => (
  <span
    class="inline-flex items-center gap-1 rounded-full px-2 py-1"
    style="border:1px solid var(--ui-border)"
    aria-hidden="true"
  >
    <span class="size-3 rounded-full" style="background:var(--ui-primary)" />
    <span class="size-3 rounded-full" style="background:var(--ui-accent)" />
  </span>
));

export const SampleMobileShell = component$((props: { open?: boolean }) => (
  <div class="relative h-full overflow-hidden" style="background:var(--ui-bg)">
    {/* Mobile header */}
    <div style="background:var(--ui-surface);border-bottom:1px solid var(--ui-border)">
      <div class="flex items-center gap-2 px-3 py-2.5">
        <span class="grid size-9 place-items-center rounded-xl" style="border:1px solid var(--ui-border);color:var(--ui-text)" aria-hidden="true">
          <svg viewBox="0 0 24 24" class="size-5" fill="none">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </span>
        <Brand size="sm" />
        <span class="ml-auto"><ThemeChip /></span>
      </div>
      <div class="px-3 pb-3">
        <div class="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-medium" style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text-muted)">
          <Search />
          Where to? Search trips
        </div>
      </div>
    </div>

    {/* Sample content behind the menu */}
    <div class="relative overflow-hidden" style="background-image:var(--ui-hero)">
      <div class="absolute inset-0" style="background-image:var(--ui-hero-scrim)" />
      <div class="relative px-4 py-7">
        <h4 class="max-w-[16ch] text-xl font-bold leading-tight text-white" style="font-family:'Lexend Variable',var(--system-font-family)">
          Find better trips
        </h4>
        <p class="mt-1 text-[12px] text-white/85">Flights · Hotels · Cars · Explore</p>
      </div>
    </div>

    {/* Menu sheet (absolute within the frame) */}
    {props.open ? (
      <div class="absolute inset-0 z-10 flex flex-col p-4" style="background:var(--ui-bg)">
        <div class="flex items-center justify-between">
          <Brand size="sm" />
          <span class="grid size-9 place-items-center rounded-xl" style="border:1px solid var(--ui-border);color:var(--ui-text)" aria-hidden="true">
            <svg viewBox="0 0 24 24" class="size-5" fill="none">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </span>
        </div>
        <div class="mt-4 flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold" style="background:var(--ui-primary);color:var(--ui-on-primary)">
          <Search />
          Start a search
        </div>
        <nav class="mt-3 flex flex-col" aria-label="Primary mobile sample">
          {PRIMARY_NAV.map((l) => (
            <span key={l.href} class="rounded-xl px-3 py-2.5 text-[15px] font-semibold" style="color:var(--ui-text)">
              {l.label}
            </span>
          ))}
        </nav>
        <div class="my-2 h-px" style="background:var(--ui-divider)" />
        <span class="rounded-xl px-3 py-2.5 text-[15px] font-semibold" style="color:var(--ui-text)">My trips</span>
        <div class="mt-3 flex items-center justify-between rounded-xl px-3 py-2.5" style="background:var(--ui-surface-muted)">
          <span class="text-[13px] font-semibold" style="color:var(--ui-text)">Theme</span>
          <ThemeChip />
        </div>
        <ul class="mt-auto flex flex-col gap-1 pt-4">
          {SHELL_TRUST.map((t) => (
            <li key={t} class="flex items-center gap-2 text-[11px]" style="color:var(--ui-text-secondary)">
              <span aria-hidden="true" style="color:var(--ui-success)">✓</span>
              {t}
            </li>
          ))}
        </ul>
      </div>
    ) : null}
  </div>
));
