/**
 * CLAUDE-UI-009 — Hotel detail sample: room + rate card.
 *
 * DEV / DESIGN-SAMPLE ONLY. A calm room card with one or more selectable rate
 * rows (e.g. Flexible vs. Saver), each stating its real-language cancellation
 * and payment terms and an ILLUSTRATIVE nightly price. No fake urgency, no
 * "only N left", no fake guarantees. Built on `--ui-*`. A small gradient media
 * tile stands in for the room photo (no remote image dependency).
 */
import { component$ } from "@builder.io/qwik";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { formatMoney } from "~/lib/pricing/price-display";
import type { SampleRoom } from "~/components/dev/hotel-detail/hotelDetailSampleData";

export const RoomRateCard = component$(
  (props: { room: SampleRoom; currency: string }) => {
    const r = props.room;
    return (
      <article
        class="overflow-hidden"
        style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
      >
        <div class="grid gap-0 sm:grid-cols-[180px_minmax(0,1fr)]">
          {/* Room media */}
          <div
            class="min-h-[8rem]"
            style="background-image:var(--ui-hero)"
            role="img"
            aria-label={`${r.name} photo`}
          />

          <div class="p-4">
            <h3
              class="text-base font-bold"
              style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
            >
              {r.name}
            </h3>
            <p class="mt-0.5 text-[12px]" style="color:var(--ui-text-muted)">
              Sleeps {r.sleeps} · {r.beds} · {r.sizeSqft} sq ft
            </p>
            <div class="mt-2 flex flex-wrap gap-1.5">
              {r.features.map((f) => (
                <Badge key={f} tone="neutral" label={f} />
              ))}
            </div>
          </div>
        </div>

        {/* Rate rows */}
        <div class="border-t" style="border-color:var(--ui-divider)">
          {r.rates.map((rate, i) => (
            <div
              key={rate.name}
              class={[
                "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between",
                i > 0 ? "border-t" : "",
              ]}
              style={i > 0 ? "border-color:var(--ui-divider)" : ""}
            >
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold" style="color:var(--ui-text)">
                    {rate.name}
                  </span>
                  {rate.recommended ? (
                    <Badge tone="accent" label="Best value" />
                  ) : null}
                </div>
                <p
                  class="mt-1 inline-flex items-center gap-1 text-[12px] font-medium"
                  style={
                    rate.cancellation.startsWith("Free")
                      ? "color:var(--ui-success)"
                      : "color:var(--ui-text-muted)"
                  }
                >
                  {rate.cancellation.startsWith("Free") ? (
                    <span aria-hidden="true">✓</span>
                  ) : null}
                  {rate.cancellation}
                </p>
                <p class="text-[12px]" style="color:var(--ui-text-muted)">
                  {rate.payment}
                </p>
              </div>

              <div class="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center sm:text-right">
                <div>
                  <div
                    class="text-lg font-extrabold leading-none"
                    style="color:var(--ui-price)"
                  >
                    {formatMoney(rate.nightly, props.currency)}
                  </div>
                  <div class="text-[11px]" style="color:var(--ui-text-muted)">
                    per night · taxes incl.
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  label="Select"
                  ariaLabel={`Select ${r.name}, ${rate.name} rate`}
                  href="#booking"
                />
              </div>
            </div>
          ))}
        </div>
      </article>
    );
  },
);
