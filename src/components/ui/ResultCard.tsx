/**
 * CLAUDE-UI-002 — ResultCard base primitive.
 *
 * Summary-first card scaffold for result lists. Named slots keep a consistent
 * anatomy across verticals while letting each vertical render its own content:
 *   media · identity · facts · price · action · trust
 * Price is the visual anchor; details stay quiet. Built on `--ui-*`.
 */
import { Slot, component$ } from "@builder.io/qwik";

type ResultCardProps = {
  hasMedia?: boolean;
  hasFacts?: boolean;
  hasTrust?: boolean;
  class?: string;
};

export const ResultCard = component$((props: ResultCardProps) => (
  <article
    class={["overflow-hidden transition hover:-translate-y-px", props.class]}
    style="background:var(--ui-surface);border:1px solid var(--ui-border);border-radius:var(--ui-radius);box-shadow:var(--ui-shadow-card)"
  >
    <div class={["grid gap-0", props.hasMedia ? "md:grid-cols-[200px_minmax(0,1fr)]" : ""]}>
      {props.hasMedia ? (
        <div class="min-h-[10rem]" style="background-image:var(--ui-hero)">
          <Slot name="media" />
        </div>
      ) : null}

      <div class="p-4 md:p-5">
        <div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_200px]">
          <div class="min-w-0">
            <Slot name="identity" />
            {props.hasFacts ? (
              <div class="mt-3">
                <Slot name="facts" />
              </div>
            ) : null}
          </div>

          <aside
            class="flex flex-col gap-3 rounded-2xl p-3"
            style="background:var(--ui-surface-muted)"
          >
            <Slot name="price" />
            <div class="mt-auto">
              <Slot name="action" />
            </div>
          </aside>
        </div>

        {props.hasTrust ? (
          <div class="mt-4 border-t pt-3" style="border-color:var(--ui-divider)">
            <Slot name="trust" />
          </div>
        ) : null}
      </div>
    </div>
  </article>
));

/** Compact label/value fact, used inside ResultCard `facts`. */
export const ResultFact = component$((props: { label: string; value: string }) => (
  <div class="min-w-0">
    <div class="text-[10px] font-bold uppercase tracking-[0.08em]" style="color:var(--ui-text-muted)">
      {props.label}
    </div>
    <div class="mt-0.5 truncate text-sm font-semibold" style="color:var(--ui-text)">
      {props.value}
    </div>
  </div>
));

/** Price block — the visual anchor of a result card. */
export const ResultPrice = component$(
  (props: { label?: string; amount: string; qualifier?: string }) => (
    <div>
      {props.label ? (
        <div class="text-[10px] font-medium" style="color:var(--ui-text-muted)">
          {props.label}
        </div>
      ) : null}
      <div class="text-2xl font-extrabold leading-none" style="color:var(--ui-price)">
        {props.amount}
      </div>
      {props.qualifier ? (
        <div class="mt-0.5 text-[11px]" style="color:var(--ui-text-muted)">
          {props.qualifier}
        </div>
      ) : null}
    </div>
  ),
);
