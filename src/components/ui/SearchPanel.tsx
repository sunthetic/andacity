/**
 * CLAUDE-UI-002 — SearchPanel primitive.
 *
 * Elevated, glass-style search surface usable in `hero` (large, over imagery)
 * or `inline` (compact, on-page) contexts. The `fields` API gives a quick
 * labeled-field composition for samples; pages can also project custom content
 * via the default slot.
 */
import { Slot, component$ } from "@builder.io/qwik";

type Field = { label: string; value: string };

type SearchPanelProps = {
  fields?: Field[];
  actionLabel?: string;
  variant?: "hero" | "inline";
  class?: string;
};

export const SearchPanel = component$((props: SearchPanelProps) => {
  const fields = props.fields ?? [];
  return (
    <div
      class={[
        "flex flex-col gap-3 p-3 md:flex-row md:items-end",
        props.class,
      ]}
      style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-panel)"
    >
      {fields.length ? (
        <>
          {fields.map((f) => (
            <div
              key={f.label}
              class="min-w-0 flex-1 rounded-lg px-3 py-2"
              style="background:var(--ui-surface-muted);border-radius:var(--ui-radius-sm)"
            >
              <div class="text-[10px] font-bold uppercase tracking-[0.1em]" style="color:var(--ui-text-muted)">
                {f.label}
              </div>
              <div class="mt-0.5 truncate text-sm font-semibold" style="color:var(--ui-text)">
                {f.value}
              </div>
            </div>
          ))}
          <button
            type="button"
            class="shrink-0 px-5 py-2.5 text-sm font-bold transition hover:brightness-[1.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ui-ring)]"
            style="background:var(--ui-primary);color:var(--ui-on-primary);border-radius:var(--ui-radius)"
          >
            {props.actionLabel ?? "Search"}
          </button>
        </>
      ) : (
        <Slot />
      )}
    </div>
  );
});
