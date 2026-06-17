/** CLAUDE-UI-002 — CarCard primitive (vehicle-led, price-anchored). */
import { component$ } from "@builder.io/qwik";
import { Button } from "~/components/ui/Button";

export type CarCardModel = {
  name: string;
  spec: string;
  pickup: string;
  pricePerDay: string;
  imageUrl?: string;
  href?: string;
};

const CarGlyph = component$(() => (
  <svg viewBox="0 0 48 24" width="64" height="32" aria-hidden="true">
    <path
      d="M4 16l2-6a4 4 0 0 1 3.7-2.6h11.2a4 4 0 0 1 3.3 1.8L31 14l9 1.6a3 3 0 0 1 2.5 3V20h-4M4 16v4h4M4 16h28M12 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm22 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
      fill="none"
      stroke="var(--ui-text-muted)"
      stroke-width="1.6"
      stroke-linejoin="round"
      stroke-linecap="round"
    />
  </svg>
));

export const CarCard = component$((props: { model: CarCardModel }) => {
  const m = props.model;
  return (
    <article
      class="flex flex-col overflow-hidden transition hover:-translate-y-px"
      style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
    >
      <div
        class="grid h-28 place-items-center"
        style={
          m.imageUrl
            ? `background-image:url(${m.imageUrl});background-size:cover;background-position:center`
            : "background:var(--ui-surface-muted)"
        }
      >
        {m.imageUrl ? null : <CarGlyph />}
      </div>
      <div class="flex flex-1 flex-col p-4">
        <h3 class="text-base font-bold" style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)">
          {m.name}
        </h3>
        <p class="text-[12px]" style="color:var(--ui-text-muted)">{m.spec} · {m.pickup}</p>
        <div class="mt-3 flex items-end justify-between gap-2">
          <div>
            <div class="text-[10px]" style="color:var(--ui-text-muted)">Per day</div>
            <div class="text-lg font-extrabold leading-none" style="color:var(--ui-price)">{m.pricePerDay}</div>
          </div>
          <Button variant="primary" size="sm" href={m.href} label="Reserve" ariaLabel={`Reserve ${m.name}`} />
        </div>
      </div>
    </article>
  );
});
