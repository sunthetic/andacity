/**
 * CLAUDE-UI-002 — TrustStrip primitive.
 *
 * Quiet, premium row of trust signals (free cancellation, total price, etc.).
 * Deliberately calm — never red urgency.
 */
import { component$ } from "@builder.io/qwik";

export type TrustItem = { icon?: string; label: string };

export const TrustStrip = component$((props: { items: TrustItem[]; class?: string }) => (
  <ul class={["flex flex-wrap items-center gap-x-5 gap-y-2", props.class]}>
    {props.items.map((item) => (
      <li key={item.label} class="flex items-center gap-1.5 text-[12px]" style="color:var(--ui-text-secondary)">
        <span aria-hidden="true" style="color:var(--ui-success)">{item.icon ?? "✓"}</span>
        {item.label}
      </li>
    ))}
  </ul>
));
