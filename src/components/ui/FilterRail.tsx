/**
 * CLAUDE-UI-002 — FilterRail primitive.
 *
 * Quiet, fast filter sidebar. Display-only at the foundation stage; pages wire
 * interactivity during their rewrites. Active state is expressed via `checked`.
 */
import { component$ } from "@builder.io/qwik";

export type FilterOption = { label: string; count?: number; checked?: boolean };
export type FilterGroup = { title: string; options: FilterOption[] };

type FilterRailProps = {
  groups: FilterGroup[];
  priceLabel?: string;
  /** 0–1 fill for the price range indicator. */
  priceFill?: number;
  class?: string;
};

export const FilterRail = component$((props: FilterRailProps) => (
  <aside
    class={["p-4", props.class]}
    style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
    aria-label="Filters"
  >
    <div class="text-[11px] font-bold uppercase tracking-wide" style="color:var(--ui-text)">
      Filters
    </div>

    {props.priceLabel ? (
      <div class="mt-3">
        <div class="text-[11px] font-semibold" style="color:var(--ui-text-secondary)">{props.priceLabel}</div>
        <div class="mt-1.5 h-1.5 w-full rounded-full" style="background:var(--ui-surface-muted)">
          <div
            class="h-1.5 rounded-full"
            style={`width:${Math.round((props.priceFill ?? 0.66) * 100)}%;background:var(--ui-primary)`}
          />
        </div>
      </div>
    ) : null}

    {props.groups.map((group) => (
      <div key={group.title} class="mt-4">
        <div class="text-[11px] font-semibold" style="color:var(--ui-text-secondary)">{group.title}</div>
        <ul class="mt-1.5 flex flex-col gap-1.5">
          {group.options.map((opt) => (
            <li key={opt.label}>
              <label class="flex items-center gap-2 text-[12px]" style="color:var(--ui-text-muted)">
                <span
                  class="grid size-4 place-items-center rounded-[5px]"
                  style={
                    opt.checked
                      ? "background:var(--ui-primary);color:var(--ui-on-primary)"
                      : "border:1px solid var(--ui-border)"
                  }
                  aria-hidden="true"
                >
                  {opt.checked ? <span class="text-[10px]">✓</span> : null}
                </span>
                <span class="flex-1">{opt.label}</span>
                {opt.count != null ? <span style="color:var(--ui-text-muted)">{opt.count}</span> : null}
              </label>
            </li>
          ))}
        </ul>
      </div>
    ))}
  </aside>
));
