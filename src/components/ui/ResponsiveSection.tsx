/**
 * CLAUDE-UI-002 — ResponsiveSection primitive.
 *
 * Standard content section with an optional heading row (title + description +
 * trailing action slot) and a consistent max-width container. `bleed` opts the
 * background band out of the container while keeping content aligned.
 */
import { Slot, component$ } from "@builder.io/qwik";

type ResponsiveSectionProps = {
  id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  class?: string;
  container?: boolean;
};

export const ResponsiveSection = component$((props: ResponsiveSectionProps) => {
  const inner = (
    <>
      {props.eyebrow || props.title || props.description ? (
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div class="max-w-[60ch]">
            {props.eyebrow ? (
              <p class="text-[11px] font-bold uppercase tracking-[0.14em]" style="color:var(--ui-text-muted)">
                {props.eyebrow}
              </p>
            ) : null}
            {props.title ? (
              <h2
                class="mt-1 text-2xl font-bold tracking-tight md:text-3xl"
                style="color:var(--ui-text);font-family:'Lexend Variable',var(--system-font-family)"
              >
                {props.title}
              </h2>
            ) : null}
            {props.description ? (
              <p class="mt-2 text-sm md:text-base" style="color:var(--ui-text-muted)">
                {props.description}
              </p>
            ) : null}
          </div>
          <div class="shrink-0">
            <Slot name="action" />
          </div>
        </div>
      ) : null}

      <div class={props.title || props.description ? "mt-6" : undefined}>
        <Slot />
      </div>
    </>
  );

  return (
    <section id={props.id} class={["py-8 md:py-10", props.class]}>
      {props.container === false ? inner : <div class="mx-auto max-w-6xl px-4">{inner}</div>}
    </section>
  );
});
