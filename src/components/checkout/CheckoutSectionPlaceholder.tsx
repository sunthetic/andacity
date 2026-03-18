import { component$, Slot } from "@builder.io/qwik";

export const CheckoutSectionPlaceholder = component$(
  (props: { title: string; description: string; statusLabel?: string }) => {
    return (
      <section class="rounded-[var(--radius-xl)] border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
              {props.title}
            </p>
            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              {props.description}
            </p>
          </div>

          {props.statusLabel ? (
            <span class="rounded-full border border-[color:var(--color-border)] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
              {props.statusLabel}
            </span>
          ) : null}
        </div>
        <div class="mt-4 text-sm text-[color:var(--color-text-muted)]">
          <Slot />
        </div>
      </section>
    );
  },
);
