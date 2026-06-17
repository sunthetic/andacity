/**
 * CLAUDE-UI-003 — Global shell sample: footer.
 *
 * DEV / DESIGN-SAMPLE ONLY. Editorial, calm footer with real link columns,
 * a quiet trust strip, and a theme control. Columns are a grid on desktop and
 * collapse to accordions on mobile. Consumes `--ui-*`.
 */
import { component$ } from "@builder.io/qwik";
import { ThemeController } from "~/components/ui/theme/ThemeController";
import { Brand } from "~/components/dev/shell/SampleHeader";
import { FOOTER_NAV, SHELL_TRUST } from "~/components/dev/shell/nav";

export const SampleFooter = component$(() => {
  const year = 2026;
  return (
    <footer style="background:var(--ui-surface);border-top:1px solid var(--ui-border)" aria-label="Site footer">
      {/* Trust strip */}
      <div class="border-b" style="border-color:var(--ui-divider)">
        <ul class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4">
          {SHELL_TRUST.map((t) => (
            <li key={t} class="flex items-center gap-2 text-[13px]" style="color:var(--ui-text-secondary)">
              <span aria-hidden="true" style="color:var(--ui-success)">✓</span>
              {t}
            </li>
          ))}
        </ul>
      </div>

      <div class="mx-auto max-w-6xl px-4 py-10">
        <div class="grid gap-8 lg:grid-cols-[1.4fr_2fr]">
          {/* Brand block */}
          <div>
            <Brand />
            <p class="mt-3 max-w-[40ch] text-sm" style="color:var(--ui-text-muted)">
              Plan the whole trip in one place — flights, stays, and cars with the
              clarity of a great booking tool and the feel of a great trip.
            </p>
            <div class="mt-4 flex items-center gap-3">
              <span class="text-[12px] font-semibold" style="color:var(--ui-text-secondary)">Theme</span>
              <ThemeController />
            </div>
          </div>

          {/* Desktop columns */}
          <div class="hidden gap-8 sm:grid sm:grid-cols-3">
            {FOOTER_NAV.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h3 class="text-[13px] font-bold" style="color:var(--ui-text)">{col.title}</h3>
                <ul class="mt-3 space-y-2">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        class="text-[13px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
                        style="color:var(--ui-text-muted)"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          {/* Mobile accordions */}
          <div class="sm:hidden">
            {FOOTER_NAV.map((col) => (
              <details key={col.title} class="border-b py-1" style="border-color:var(--ui-divider)">
                <summary
                  class="flex cursor-pointer items-center justify-between py-2 text-[14px] font-bold"
                  style="color:var(--ui-text)"
                >
                  {col.title}
                  <span aria-hidden="true" style="color:var(--ui-text-muted)">+</span>
                </summary>
                <ul class="space-y-2 pb-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a href={l.href} class="text-[13px]" style="color:var(--ui-text-muted)">{l.label}</a>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div class="mt-10 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between" style="border-color:var(--ui-divider)">
          <p class="text-[12px]" style="color:var(--ui-text-muted)">
            © {year} Andacity, a Sunthetic Media venture. All rights reserved.
          </p>
          <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px]">
            {["Privacy", "Terms", "Sitemap", "Accessibility"].map((l) => (
              <a key={l} href="/" class="focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]" style="color:var(--ui-text-muted)">
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
});
