/**
 * CLAUDE-UI-003 — Global shell sample: responsive header.
 *
 * DEV / DESIGN-SAMPLE ONLY (rendered at /dev/ui-shell). Sticky, adaptive
 * (condenses on scroll), with fast vertical access, a product-native search
 * affordance, the polished ThemeController, a Trips/account entry, and an
 * accessible mobile sheet. Consumes the `--ui-*` foundation tokens.
 */
import { $, Slot, component$, useOnDocument, useSignal } from "@builder.io/qwik";
import { ThemeController } from "~/components/ui/theme/ThemeController";
import { PRIMARY_NAV, SHELL_TRUST } from "~/components/dev/shell/nav";

export const Brand = component$((props: { size?: "sm" | "md" }) => (
  <a
    href="/"
    class={[
      "inline-flex items-center font-extrabold tracking-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]",
      props.size === "sm" ? "text-base" : "text-lg",
    ]}
    style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
    aria-label="Andacity home"
  >
    Anda<span style="color:var(--ui-primary)">city</span>
  </a>
));

const SearchIcon = component$((props: { class?: string }) => (
  <svg viewBox="0 0 24 24" class={props.class ?? "size-4"} fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
    <path d="m20 20-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  </svg>
));

/** Desktop search affordance — a real entry point, not a scroll anchor. */
const SearchPill = component$(() => (
  <button
    type="button"
    class="hidden items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition hover:brightness-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)] lg:inline-flex"
    style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text-muted)"
    aria-label="Search flights, hotels, and cars"
  >
    <SearchIcon />
    <span>Search flights, hotels, cars</span>
  </button>
));

const TripsButton = component$(() => (
  <a
    href="/trips"
    class="hidden items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition hover:brightness-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)] sm:inline-flex"
    style="border:1px solid var(--ui-border);color:var(--ui-text)"
  >
    <span class="grid size-5 place-items-center rounded-full text-[11px]" style="background:var(--ui-primary);color:var(--ui-on-primary)" aria-hidden="true">
      A
    </span>
    Trips
  </a>
));

export const SampleHeader = component$((props: { stickyTop?: string }) => {
  const scrolled = useSignal(false);
  const menuOpen = useSignal(false);

  useOnDocument(
    "scroll",
    $(() => {
      scrolled.value = window.scrollY > 8;
    }),
  );
  useOnDocument(
    "keydown",
    $((e: KeyboardEvent) => {
      if (e.key === "Escape") menuOpen.value = false;
    }),
  );

  return (
    <header
      class="sticky z-30"
      style={`top:${props.stickyTop ?? "0px"};background:var(--ui-surface);border-bottom:1px solid var(--ui-border);${
        scrolled.value ? "box-shadow:var(--ui-shadow-card);" : ""
      }`}
    >
      <div
        class={[
          "mx-auto flex max-w-6xl items-center gap-3 px-4 transition-[height]",
          scrolled.value ? "h-14" : "h-16",
        ]}
      >
        {/* Mobile menu button */}
        <button
          type="button"
          class="grid size-10 place-items-center rounded-xl md:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
          style="border:1px solid var(--ui-border);color:var(--ui-text)"
          aria-label="Open menu"
          aria-expanded={menuOpen.value}
          onClick$={() => (menuOpen.value = true)}
        >
          <svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>

        <Brand />

        {/* Desktop primary nav */}
        <nav class="ml-2 hidden items-center gap-1 md:flex" aria-label="Primary">
          {PRIMARY_NAV.map((l) => (
            <a
              key={l.href}
              href={l.href}
              class="rounded-lg px-3 py-2 text-[13.5px] font-medium transition hover:brightness-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
              style="color:var(--ui-text-secondary)"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div class="ml-auto flex items-center gap-2">
          <SearchPill />
          {/* Compact search icon for md/tablet */}
          <button
            type="button"
            class="hidden size-10 place-items-center rounded-xl md:grid lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
            style="border:1px solid var(--ui-border);color:var(--ui-text)"
            aria-label="Search"
          >
            <SearchIcon class="size-4" />
          </button>
          <ThemeController align="right" />
          <TripsButton />
        </div>
      </div>

      {/* Mobile inline search trigger (below brand row) */}
      <div class="px-4 pb-3 md:hidden">
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
          style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text-muted)"
        >
          <SearchIcon />
          Where to? Search flights, hotels, cars
        </button>
      </div>

      {/* Mobile menu sheet */}
      {menuOpen.value ? (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            class="fixed inset-0 z-40 cursor-default"
            style="background:rgba(2,6,16,0.45)"
            onClick$={() => (menuOpen.value = false)}
          />
          <div
            role="dialog"
            aria-label="Menu"
            class="fixed inset-y-0 right-0 z-50 flex w-[88vw] max-w-sm flex-col overflow-y-auto p-4"
            style="background:var(--ui-bg)"
          >
            <div class="flex items-center justify-between">
              <Brand />
              <button
                type="button"
                class="grid size-10 place-items-center rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
                style="border:1px solid var(--ui-border);color:var(--ui-text)"
                aria-label="Close menu"
                onClick$={() => (menuOpen.value = false)}
              >
                <svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
              </button>
            </div>

            <button
              type="button"
              class="mt-4 flex w-full items-center gap-2 rounded-xl px-3.5 py-3 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
              style="background:var(--ui-primary);color:var(--ui-on-primary)"
            >
              <SearchIcon />
              Start a search
            </button>

            <nav class="mt-4 flex flex-col" aria-label="Primary mobile">
              {PRIMARY_NAV.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  class="rounded-xl px-3 py-3 text-base font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
                  style="color:var(--ui-text)"
                >
                  {l.label}
                </a>
              ))}
            </nav>

            <div class="my-3 h-px" style="background:var(--ui-divider)" />

            <a
              href="/trips"
              class="rounded-xl px-3 py-3 text-base font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
              style="color:var(--ui-text)"
            >
              My trips
            </a>

            <div class="mt-4 flex items-center justify-between rounded-xl px-3 py-3" style="background:var(--ui-surface-muted)">
              <span class="text-sm font-semibold" style="color:var(--ui-text)">Theme</span>
              <ThemeController align="right" />
            </div>

            <ul class="mt-auto flex flex-col gap-1.5 pt-6">
              {SHELL_TRUST.map((t) => (
                <li key={t} class="flex items-center gap-2 text-[12px]" style="color:var(--ui-text-secondary)">
                  <span aria-hidden="true" style="color:var(--ui-success)">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}

      <Slot />
    </header>
  );
});
