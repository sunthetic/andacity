/** CLAUDE-UI-002 — HotelCard primitive (image-led, price-anchored). */
import { component$ } from "@builder.io/qwik";
import { Badge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";

export type HotelCardModel = {
  name: string;
  area: string;
  rating: number;
  reviewCount?: number;
  stars?: number;
  priceTotal: string;
  priceQualifier?: string;
  imageUrl?: string;
  badges?: string[];
  href?: string;
};

export const HotelCard = component$((props: { model: HotelCardModel }) => {
  const m = props.model;
  return (
    <article
      class="flex flex-col overflow-hidden transition hover:-translate-y-px"
      style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
    >
      <div
        class="h-32"
        style={
          m.imageUrl
            ? `background-image:url(${m.imageUrl});background-size:cover;background-position:center`
            : "background-image:var(--ui-hero)"
        }
        role="img"
        aria-label={`${m.name} photo`}
      />
      <div class="flex flex-1 flex-col p-4">
        <div class="flex items-center gap-1 text-[12px]" style="color:var(--ui-accent)" aria-label={`${m.stars ?? 5} star`}>
          {"★".repeat(m.stars ?? 5)}
        </div>
        <h3 class="mt-1 text-base font-bold" style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)">
          {m.name}
        </h3>
        <p class="text-[12px]" style="color:var(--ui-text-muted)">
          {m.area} · {m.rating.toFixed(1)}
          {m.reviewCount ? ` (${m.reviewCount.toLocaleString("en-US")})` : ""}
        </p>

        {m.badges?.length ? (
          <div class="mt-2 flex flex-wrap gap-1.5">
            {m.badges.slice(0, 2).map((b) => (
              <Badge key={b} tone="success" label={b} />
            ))}
          </div>
        ) : null}

        <div class="mt-3 flex items-end justify-between gap-2">
          <div>
            <div class="text-[10px]" style="color:var(--ui-text-muted)">
              {m.priceQualifier ?? "Total stay"}
            </div>
            <div class="text-lg font-extrabold leading-none" style="color:var(--ui-price)">
              {m.priceTotal}
            </div>
          </div>
          <Button variant="primary" size="sm" href={m.href} label="View" ariaLabel={`View ${m.name}`} />
        </div>
      </div>
    </article>
  );
});
