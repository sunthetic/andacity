/**
 * CLAUDE-UI-009 — Hotel detail sample: desktop booking rail.
 *
 * DEV / DESIGN-SAMPLE ONLY. The sticky right-column conversion zone: a calm
 * price/availability module (ILLUSTRATIVE "from" price, explicitly labelled),
 * a date/guest refinement, the primary "Select a room" CTA, and a quiet
 * confidence note — no countdown timers, no scarcity, no fake guarantees.
 * Built on `--ui-*`.
 *
 * Boundary: the date/guest fields are presentational. In production
 * (CLAUDE-UI-010) this rail keeps the existing real date refinement (the
 * production detail page already submits a GET form with the DateField
 * primitive) and the real decisioning actions (Save / Compare / Add to trip).
 */
import { component$ } from "@builder.io/qwik";
import { Button } from "~/components/ui/Button";
import { formatMoney } from "~/lib/pricing/price-display";
import type { SampleHotel } from "~/components/dev/hotel-detail/hotelDetailSampleData";

const Field = component$((props: { label: string; value: string }) => (
  <div
    class="min-w-0 rounded-xl px-3 py-2"
    style="background:var(--ui-surface-muted);border:1px solid var(--ui-border)"
  >
    <div
      class="text-[10px] font-bold uppercase tracking-[0.1em]"
      style="color:var(--ui-text-muted)"
    >
      {props.label}
    </div>
    <div
      class="mt-0.5 truncate text-sm font-semibold"
      style="color:var(--ui-text)"
    >
      {props.value}
    </div>
  </div>
));

const ActionChip = component$((props: { label: string; icon: string }) => (
  <button
    type="button"
    class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition hover:brightness-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
    style="background:var(--ui-surface);border:1px solid var(--ui-border);color:var(--ui-text)"
  >
    <span aria-hidden="true">{props.icon}</span>
    {props.label}
  </button>
));

export const BookingRail = component$((props: { hotel: SampleHotel }) => {
  const h = props.hotel;
  return (
    <aside class="lg:sticky lg:top-20" id="booking" aria-label="Booking">
      <div
        class="p-5"
        style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius-lg);box-shadow:var(--ui-shadow-panel)"
      >
        {/* Price module */}
        <div class="flex items-end justify-between gap-2">
          <div>
            <div
              class="text-[11px] font-semibold uppercase tracking-[0.08em]"
              style="color:var(--ui-text-muted)"
            >
              From
            </div>
            <div class="mt-0.5 flex items-end gap-1.5">
              <span
                class="text-3xl font-extrabold leading-none"
                style="color:var(--ui-text)"
              >
                {formatMoney(h.fromNightly, h.currency)}
              </span>
              <span class="pb-0.5 text-sm" style="color:var(--ui-text-muted)">
                / night
              </span>
            </div>
          </div>
          <span
            class="rounded-full px-2.5 py-1 text-[10px] font-bold"
            style="background:var(--ui-accent-soft);color:var(--ui-accent)"
          >
            Sample rate
          </span>
        </div>
        <p class="mt-1 text-[12px]" style="color:var(--ui-text-muted)">
          Taxes &amp; fees included in the total. Set dates to see your full
          stay total.
        </p>

        {/* Date / guests refinement */}
        <div class="mt-4 grid grid-cols-2 gap-2">
          <Field label="Check-in" value="Jun 14" />
          <Field label="Check-out" value="Jun 20" />
        </div>
        <div class="mt-2">
          <Field label="Guests & rooms" value="2 guests · 1 room" />
        </div>

        <div class="mt-4">
          <Button variant="primary" full label="Select a room" href="#rooms" />
        </div>

        {/* Decisioning actions (visual concept; real in production) */}
        <div class="mt-3 flex flex-wrap gap-2">
          <ActionChip label="Save" icon="♡" />
          <ActionChip label="Compare" icon="⇄" />
          <ActionChip label="Add to trip" icon="+" />
        </div>

        {/* Calm confidence note — no urgency */}
        <p
          class="mt-4 border-t pt-3 text-[12px]"
          style="border-color:var(--ui-divider);color:var(--ui-text-muted)"
        >
          Prices and availability update when you set dates. Shareable link — no
          account needed to compare.
        </p>
      </div>

      {/* Secondary trust mini-card */}
      <div
        class="mt-4 p-5"
        style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
      >
        <div class="text-sm font-bold" style="color:var(--ui-text)">
          Why book with Andacity
        </div>
        <ul class="mt-3 flex flex-col gap-2">
          {[
            "Transparent total pricing",
            "Policies shown before you pay",
            "Compare stays without pressure",
          ].map((t) => (
            <li
              key={t}
              class="flex items-center gap-2 text-[13px]"
              style="color:var(--ui-text-secondary)"
            >
              <span aria-hidden="true" style="color:var(--ui-success)">
                ✓
              </span>
              {t}
            </li>
          ))}
        </ul>
        <div class="mt-4">
          <Button
            variant="secondary"
            size="sm"
            full
            label="Compare more hotels"
            href="/hotels/in/miami"
          />
        </div>
      </div>
    </aside>
  );
});
