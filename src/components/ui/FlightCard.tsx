/** CLAUDE-UI-002 — FlightCard primitive (route timeline, price-anchored). */
import { component$ } from "@builder.io/qwik";
import { Button } from "~/components/ui/Button";

export type FlightCardModel = {
  airline: string;
  duration: string;
  stops: string;
  departTime: string;
  departCode: string;
  arriveTime: string;
  arriveCode: string;
  price: string;
  priceQualifier?: string;
  href?: string;
};

export const FlightCard = component$((props: { model: FlightCardModel }) => {
  const m = props.model;
  return (
    <article
      class="flex flex-col overflow-hidden p-4 transition hover:-translate-y-px"
      style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
    >
      <div class="flex items-center justify-between text-[11px]" style="color:var(--ui-text-muted)">
        <span>{m.stops} · {m.duration}</span>
        <span>{m.airline}</span>
      </div>

      <div class="mt-3 flex items-center gap-2">
        <div class="text-center">
          <div class="text-sm font-bold" style="color:var(--ui-text)">{m.departTime}</div>
          <div class="text-[11px]" style="color:var(--ui-text-muted)">{m.departCode}</div>
        </div>
        <div class="relative flex-1" aria-hidden="true">
          <div class="h-px w-full" style="background:var(--ui-border)" />
          <span class="absolute -top-1 left-0 size-2 rounded-full" style="background:var(--ui-primary)" />
          <span class="absolute -top-1 right-0 size-2 rounded-full" style="background:var(--ui-accent)" />
          <span class="absolute -top-2 left-1/2 -translate-x-1/2 text-[11px]" style="color:var(--ui-primary)">✈</span>
        </div>
        <div class="text-center">
          <div class="text-sm font-bold" style="color:var(--ui-text)">{m.arriveTime}</div>
          <div class="text-[11px]" style="color:var(--ui-text-muted)">{m.arriveCode}</div>
        </div>
      </div>

      <div class="mt-3 flex items-end justify-between gap-2">
        <div>
          <div class="text-[10px]" style="color:var(--ui-text-muted)">{m.priceQualifier ?? "Round trip"}</div>
          <div class="text-lg font-extrabold leading-none" style="color:var(--ui-price)">{m.price}</div>
        </div>
        <Button variant="primary" size="sm" href={m.href} label="Select" ariaLabel={`Select ${m.airline} flight`} />
      </div>
    </article>
  );
});
