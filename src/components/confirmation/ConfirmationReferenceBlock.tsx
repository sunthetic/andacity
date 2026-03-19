import { component$ } from "@builder.io/qwik";
import type { ConfirmationReferenceGroup } from "~/lib/confirmation/getConfirmationPageModel";

export const ConfirmationReferenceBlock = component$(
  (props: { groups: ConfirmationReferenceGroup[] }) => {
    return (
      <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
              Booking references
            </p>
            <p class="mt-1 text-sm text-[color:var(--color-text-muted)]">
              Keep these provider references handy if you need to contact
              support.
            </p>
          </div>
        </div>

        {props.groups.length ? (
          <div class="mt-5 space-y-3">
            {props.groups.map((group) => (
              <article
                key={group.id}
                class="rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-muted,#f8fafc)] p-4"
              >
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                      {group.itemTitle}
                    </p>
                    {group.providerLabel ? (
                      <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                        Provider {group.providerLabel}
                      </p>
                    ) : null}
                  </div>

                  <div class="grid min-w-[240px] gap-2">
                    {group.references.map((reference) => (
                      <div
                        key={`${group.id}-${reference.label}`}
                        class="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2"
                      >
                        <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
                          {reference.label}
                        </p>
                        <p class="mt-1 font-mono text-sm font-semibold text-[color:var(--color-text-strong)]">
                          {reference.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p class="mt-4 text-sm text-[color:var(--color-text-muted)]">
            Provider references will appear here when they are available.
          </p>
        )}
      </section>
    );
  },
);
