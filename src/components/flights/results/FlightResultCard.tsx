/**
 * CLAUDE-UI-016 — production flight result card on the `--ui-*` system.
 *
 * Accepts the real `FlightResultCardModel` (from mapFlightResultCardForUi).
 * Three-zone grid: identity (airline, flight number, cabin) / timeline
 * (depart → duration + stops → arrive) / price + CTA.
 *
 * Fare safety: only real fields from the model are displayed. No fake urgency,
 * seat counts, price-drop, or guarantee claims.
 */
import { component$ } from "@builder.io/qwik";
import type { FlightResultCardModel } from "~/types/search-ui";

const HEADING_FONT = "'Lexend Variable',var(--system-font-family)";

export const FlightResultCard = component$((props: FlightResultCardProps) => {
  const card = props.card;
  const isNonstop = card.stopCount === 0;

  return (
    <article
      aria-label={`${card.airlineLabel}, ${card.originCode} to ${card.destinationCode}, ${card.durationLabel}, ${card.stopSummary}, ${card.price.display}`}
      class="overflow-hidden p-4 transition hover:-translate-y-px md:p-5"
      style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
    >
      <div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] md:items-center">

        {/* Identity zone — airline, flight number, cabin */}
        <div class="flex items-start gap-3">
          <span
            class="grid size-10 shrink-0 place-items-center rounded-full text-[14px]"
            style="background:var(--ui-accent-soft);color:var(--ui-accent)"
            aria-hidden="true"
          >
            ✈
          </span>
          <div class="min-w-0">
            <div
              class="text-sm font-bold leading-tight"
              style={`color:var(--ui-text);font-family:${HEADING_FONT}`}
            >
              {card.airlineLabel}
            </div>
            <div class="mt-0.5 flex flex-wrap items-center gap-1.5">
              {card.flightNumberLabel ? (
                <span
                  class="rounded px-1.5 py-0.5 text-[11px] font-semibold"
                  style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text-secondary)"
                >
                  {card.flightNumberLabel}
                </span>
              ) : null}
              {card.cabinLabel ? (
                <span class="text-[11px]" style="color:var(--ui-text-muted)">
                  {card.cabinLabel}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Timeline zone — depart → duration/stops → arrive */}
        <div class="flex items-center gap-3">
          <div class="text-center">
            <div class="text-sm font-bold leading-tight" style="color:var(--ui-text)">
              {card.departAtLabel}
            </div>
            <div class="text-[11px] font-semibold" style="color:var(--ui-text-muted)">
              {card.originCode}
            </div>
          </div>

          <div class="relative min-w-0 flex-1" aria-hidden="true">
            <div class="text-center text-[10px] font-semibold" style="color:var(--ui-text-muted)">
              {card.durationLabel}
            </div>
            <div class="relative mt-1">
              <div class="h-px w-full" style="background:var(--ui-border)" />
              <span
                class="absolute -top-1 left-0 size-2 rounded-full"
                style="background:var(--ui-primary)"
              />
              <span
                class="absolute -top-1 right-0 size-2 rounded-full"
                style="background:var(--ui-accent)"
              />
              {!isNonstop ? (
                <span
                  class="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full"
                  style="background:var(--ui-text-muted)"
                />
              ) : null}
            </div>
            <div
              class="mt-1 text-center text-[10px] font-semibold"
              style={isNonstop ? "color:var(--ui-primary)" : "color:var(--ui-accent)"}
            >
              {card.stopSummary}
            </div>
          </div>

          <div class="text-center">
            <div class="text-sm font-bold leading-tight" style="color:var(--ui-text)">
              {card.arriveAtLabel}
            </div>
            <div class="text-[11px] font-semibold" style="color:var(--ui-text-muted)">
              {card.destinationCode}
            </div>
          </div>
        </div>

        {/* Price + CTA zone */}
        <div class="flex items-end justify-between gap-3 md:flex-col md:items-end">
          <div class="md:text-right">
            <div
              class="text-[10px] font-semibold uppercase tracking-[0.08em]"
              style="color:var(--ui-text-muted)"
            >
              Total price
            </div>
            <div
              class="text-2xl font-extrabold leading-none"
              style="color:var(--ui-price)"
            >
              {card.price.display}
            </div>
            <div class="text-[10px]" style="color:var(--ui-text-muted)">
              {card.price.currency
                ? `${card.price.currency} · incl. taxes & fees`
                : "incl. taxes & fees"}
            </div>
          </div>

          {card.ctaHref && !card.ctaDisabled ? (
            <a
              href={card.ctaHref}
              aria-label={`View ${card.airlineLabel} flight from ${card.originCode} to ${card.destinationCode}`}
              class="inline-flex shrink-0 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[color:var(--ui-ring)]"
              style="background:var(--ui-primary);color:var(--ui-on-primary);min-height:44px"
            >
              {card.ctaLabel}
            </a>
          ) : (
            <button
              type="button"
              aria-disabled="true"
              class="inline-flex shrink-0 cursor-not-allowed items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold opacity-60"
              style="background:var(--ui-primary);color:var(--ui-on-primary);min-height:44px"
            >
              {card.ctaLabel}
            </button>
          )}
        </div>
      </div>

      {/* Multi-stop itinerary — only shown when relevant */}
      {card.itinerarySummary ? (
        <p
          class="mt-3 border-t pt-3 text-[11px]"
          style="border-color:var(--ui-divider);color:var(--ui-text-muted)"
        >
          Itinerary: {card.itinerarySummary}
        </p>
      ) : null}
    </article>
  );
});

type FlightResultCardProps = {
  card: FlightResultCardModel;
};
