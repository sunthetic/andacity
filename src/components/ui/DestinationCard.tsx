/** CLAUDE-UI-002 — DestinationCard primitive (full-bleed, editorial). */
import { component$ } from "@builder.io/qwik";

export type DestinationCardModel = {
  name: string;
  meta: string;
  imageUrl?: string;
  tag?: string;
  href?: string;
};

export const DestinationCard = component$((props: { model: DestinationCardModel }) => {
  const m = props.model;
  return (
    <a
      href={m.href}
      class="relative block overflow-hidden transition hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
      style="border-radius:var(--ui-radius);min-height:11rem;box-shadow:var(--ui-shadow-card)"
      aria-label={`Explore ${m.name}`}
    >
      <span
        class="absolute inset-0"
        style={
          m.imageUrl
            ? `background-image:url(${m.imageUrl});background-size:cover;background-position:center`
            : "background-image:var(--ui-hero)"
        }
        aria-hidden="true"
      />
      <span class="absolute inset-0" style="background:linear-gradient(180deg,transparent 35%,rgba(0,0,0,0.62) 100%)" aria-hidden="true" />
      {m.tag ? (
        <span
          class="absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
          style="background:var(--ui-accent);color:#15110a"
        >
          {m.tag}
        </span>
      ) : null}
      <span class="absolute inset-x-0 bottom-0 p-4">
        <span class="block text-lg font-bold text-white" style="font-family:'Lexend Variable',var(--system-font-family)">
          {m.name}
        </span>
        <span class="block text-[12px] text-white/85">{m.meta}</span>
      </span>
    </a>
  );
});
