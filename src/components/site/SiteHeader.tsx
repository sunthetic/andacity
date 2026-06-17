/**
 * Global site header.
 *
 * CLAUDE-UI-004: production promotion of the approved CLAUDE-UI-003 shell
 * sample. Sticky, condenses on scroll, flat top-level vertical nav (no hover
 * mega-menu), a persistent search affordance that links into the existing
 * canonical search entry point, the new visitor-facing ThemeController, and
 * an accessible mobile navigation sheet. Built on the `--ui-*` token system.
 */
import {
  $,
  component$,
  useOnDocument,
  useSignal,
  useVisibleTask$,
} from "@builder.io/qwik";
import { Brand } from "~/components/site/Brand";
import { ThemeController } from "~/components/ui/theme/ThemeController";
import { PRIMARY_NAV, SEARCH_HREF, SEARCH_LABEL } from "~/components/site/siteNav";

const SearchIcon = component$((props: { class?: string }) => (
  <svg viewBox="0 0 24 24" class={props.class ?? "size-4"} fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
    <path d="m20 20-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  </svg>
));

const MenuIcon = component$(() => (
  <svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
    <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  </svg>
));

const CloseIcon = component$(() => (
  <svg viewBox="0 0 24 24" class="size-5" fill="none" aria-hidden="true">
    <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  </svg>
));

export const SiteHeader = component$(() => {
  const scrolled = useSignal(false);
  const menuOpen = useSignal(false);
  const hasToggledMenu = useSignal(false);
  const hamburgerRef = useSignal<HTMLButtonElement>();
  const closeButtonRef = useSignal<HTMLButtonElement>();

  useOnDocument(
    "scroll",
    $(() => {
      scrolled.value = window.scrollY > 8;
    }),
  );

  useOnDocument(
    "keydown",
    $((event: KeyboardEvent) => {
      if (event.key === "Escape") menuOpen.value = false;
    }),
  );

  // Move focus into the menu on open, and back to its trigger on close.
  // Skipped on first render so initial page load never steals focus.
  useVisibleTask$(({ track }) => {
    const isOpen = track(() => menuOpen.value);
    if (!hasToggledMenu.value && !isOpen) return;
    hasToggledMenu.value = true;
    if (isOpen) {
      closeButtonRef.value?.focus();
    } else {
      hamburgerRef.value?.focus();
    }
  });

  return (
    <header
      class="sticky top-0 z-40"
      style={`background:var(--ui-surface);border-bottom:1px solid var(--ui-border);${
        scrolled.value ? "box-shadow:var(--ui-shadow-card);" : ""
      }`}
    >
      <div
        class={[
          "mx-auto flex max-w-6xl items-center gap-3 px-4 transition-[height]",
          scrolled.value ? "h-14" : "h-16",
        ]}
      >
        {/* Mobile menu trigger */}
        <button
          ref={hamburgerRef}
          type="button"
          class="grid size-10 place-items-center rounded-xl md:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
          style="border:1px solid var(--ui-border);color:var(--ui-text)"
          aria-label="Open menu"
          aria-haspopup="dialog"
          aria-expanded={menuOpen.value}
          onClick$={() => (menuOpen.value = true)}
        >
          <MenuIcon />
        </button>

        <Brand />

        {/* Desktop primary nav */}
        <nav class="ml-2 hidden items-center gap-1 md:flex" aria-label="Primary">
          {PRIMARY_NAV.map((l) => (
            <a
              key={l.href}
              href={l.href}
              class="rounded-lg px-3 py-2 text-[13.5px] font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
              style="color:var(--ui-text-secondary)"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div class="ml-auto flex items-center gap-2">
          {/* Desktop search pill */}
          <a
            href={SEARCH_HREF}
            class="hidden items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition hover:brightness-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)] lg:inline-flex"
            style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text-muted)"
            aria-label={SEARCH_LABEL}
          >
            <SearchIcon />
            <span>Search flights, hotels, cars</span>
          </a>

          {/* Compact search affordance for tablet widths */}
          <a
            href={SEARCH_HREF}
            class="hidden size-10 place-items-center rounded-xl md:grid lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
            style="border:1px solid var(--ui-border);color:var(--ui-text)"
            aria-label={SEARCH_LABEL}
          >
            <SearchIcon class="size-4" />
          </a>

          {/* Theme + Trips: a single cluster, desktop/tablet only — mobile
              gets exactly one theme control, inside the menu sheet. */}
          <div class="hidden items-center gap-2 md:flex">
            <ThemeController align="right" />

            <a
              href="/my-trips"
              class="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
              style="border:1px solid var(--ui-border);color:var(--ui-text)"
            >
              <span
                class="grid size-5 place-items-center rounded-full text-[11px]"
                style="background:var(--ui-primary);color:var(--ui-on-primary)"
                aria-hidden="true"
              >
                A
              </span>
              My Trips
            </a>
          </div>
        </div>
      </div>

      {/* Mobile inline search trigger */}
      <div class="px-4 pb-3 md:hidden">
        <a
          href={SEARCH_HREF}
          class="flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
          style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text-muted)"
          aria-label={SEARCH_LABEL}
        >
          <SearchIcon />
          Where to? Search flights, hotels, cars
        </a>
      </div>

      {/* Mobile navigation sheet */}
      {menuOpen.value ? (
        <>
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            class="fixed inset-0 z-40 cursor-default"
            style="background:rgba(2,6,16,0.45)"
            onClick$={() => (menuOpen.value = false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            class="fixed inset-y-0 right-0 z-50 flex w-[88vw] max-w-sm flex-col overflow-y-auto p-4"
            style="background:var(--ui-bg)"
          >
            <div class="flex items-center justify-between">
              <Brand />
              <button
                ref={closeButtonRef}
                type="button"
                class="grid size-10 place-items-center rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
                style="border:1px solid var(--ui-border);color:var(--ui-text)"
                aria-label="Close menu"
                onClick$={() => (menuOpen.value = false)}
              >
                <CloseIcon />
              </button>
            </div>

            <a
              href={SEARCH_HREF}
              class="mt-4 flex w-full items-center gap-2 rounded-xl px-3.5 py-3 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
              style="background:var(--ui-primary);color:var(--ui-on-primary)"
              aria-label={SEARCH_LABEL}
            >
              <SearchIcon />
              Start a search
            </a>

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
              href="/my-trips"
              class="rounded-xl px-3 py-3 text-base font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
              style="color:var(--ui-text)"
            >
              My Trips
            </a>

            <div class="mt-4 flex items-center justify-between rounded-xl px-3 py-3" style="background:var(--ui-surface-muted)">
              <span class="text-sm font-semibold" style="color:var(--ui-text)">Theme</span>
              <ThemeController align="right" />
            </div>
          </div>
        </>
      ) : null}
    </header>
  );
});
