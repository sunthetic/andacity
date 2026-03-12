import { $, component$, useSignal } from "@builder.io/qwik";
import { useOverlayBehavior } from "~/lib/ui/overlay";

export const DecisionSummarySection = component$(
  (props: DecisionSummarySectionProps) => {
    const open = useSignal(false);
    const blocks = (props.blocks || [])
      .map((block) => ({
        ...block,
        items: (block.items || [])
          .map((item) => String(item || "").trim())
          .filter(Boolean),
      }))
      .filter((block) => block.items.length > 0);
    const primaryCount = Math.max(1, props.primaryBlockCount || blocks.length);
    const primaryBlocks = blocks.slice(0, primaryCount);
    const detailBlocks = blocks.slice(primaryCount);
    const hasDetailPanel =
      detailBlocks.length > 0 || Boolean(props.caveat) || Boolean(props.note);

    const onOpen$ = $(() => {
      open.value = true;
    });
    const onClose$ = $(() => {
      open.value = false;
    });
    const { overlayRef, initialFocusRef } = useOverlayBehavior({
      open,
      onClose$,
    });

    return (
      <>
        <section class="t-card p-5">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                {props.eyebrow || "Decision summary"}
              </p>
              <h2 class="mt-1 text-lg font-semibold text-[color:var(--color-text-strong)]">
                {props.title || "Quick decision summary"}
              </h2>
              {props.description ? (
                <p class="mt-2 max-w-[72ch] text-sm text-[color:var(--color-text-muted)]">
                  {props.description}
                </p>
              ) : null}
            </div>

            <div class="flex items-center gap-2">
              {props.badge ? <span class="t-badge">{props.badge}</span> : null}
              {hasDetailPanel ? (
                <button
                  type="button"
                  class="rounded-full border border-[color:var(--color-border)] px-3 py-2 text-xs font-semibold text-[color:var(--color-text-strong)]"
                  onClick$={onOpen$}
                >
                  {props.detailCtaLabel || "More details"}
                </button>
              ) : null}
            </div>
          </div>

          {props.caveat ? (
            <div
              class={[
                "mt-4 flex items-start justify-between gap-3 rounded-xl border px-4 py-3",
                caveatToneClass(props.caveat.tone),
              ]}
            >
              <div class="min-w-0">
                <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                  {props.caveat.title}
                </p>
                {props.caveat.summary ? (
                  <p class="mt-1 text-sm leading-5 text-[color:var(--color-text)]">
                    {props.caveat.summary}
                  </p>
                ) : null}
              </div>
              {hasDetailPanel ? (
                <button
                  type="button"
                  class="shrink-0 text-xs font-semibold text-[color:var(--color-text-strong)] underline underline-offset-2"
                  onClick$={onOpen$}
                >
                  Review
                </button>
              ) : null}
            </div>
          ) : null}

          {primaryBlocks.length ? (
            <div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {primaryBlocks.map((block) => (
                <section
                  key={`${block.label}:${block.items.join("|")}`}
                  class={[
                    "rounded-xl border px-4 py-4",
                    blockToneClass(block.tone),
                  ]}
                >
                  <h3 class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                    {block.label}
                  </h3>
                  <ul class="mt-3 space-y-2 text-sm leading-5 text-[color:var(--color-text)]">
                    {block.items.map((item) => (
                      <li key={item} class="flex gap-2">
                        <span
                          aria-hidden="true"
                          class="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-text-subtle)]"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : null}
        </section>

        {open.value && hasDetailPanel ? (
          <div class="fixed inset-0 z-[85]">
            <button
              type="button"
              aria-label="Close decision details"
              class="absolute inset-0 bg-black/35"
              onClick$={onClose$}
            />
            <aside
              ref={overlayRef}
              role="dialog"
              aria-modal="true"
              aria-label={props.detailTitle || props.title || "Decision details"}
              tabIndex={-1}
              class="absolute inset-x-0 bottom-0 max-h-[84vh] overflow-hidden rounded-t-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-[var(--shadow-e3)] outline-none lg:inset-y-0 lg:left-auto lg:w-[min(560px,100vw)] lg:max-h-none lg:rounded-none lg:rounded-l-3xl"
            >
              <header class="flex items-start justify-between gap-3 border-b border-[color:var(--color-divider)] px-4 py-4">
                <div class="min-w-0">
                  <p class="text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                    {props.eyebrow || "Decision summary"}
                  </p>
                  <h3 class="mt-1 text-base font-semibold text-[color:var(--color-text-strong)]">
                    {props.detailTitle || props.title || "Decision details"}
                  </h3>
                </div>
                <button
                  ref={initialFocusRef}
                  type="button"
                  class="rounded-full border border-[color:var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[color:var(--color-text-strong)]"
                  onClick$={onClose$}
                >
                  Close
                </button>
              </header>

              <div class="max-h-[calc(84vh-73px)] space-y-4 overflow-y-auto px-4 py-4 lg:max-h-[calc(100vh-73px)]">
                {props.caveat ? (
                  <div
                    class={[
                      "rounded-xl border px-4 py-3",
                      caveatToneClass(props.caveat.tone),
                    ]}
                  >
                    <p class="text-sm font-semibold text-[color:var(--color-text-strong)]">
                      {props.caveat.title}
                    </p>
                    <p class="mt-1 text-sm leading-5 text-[color:var(--color-text)]">
                      {props.caveat.message}
                    </p>
                  </div>
                ) : null}

                {detailBlocks.length ? (
                  <div class="grid gap-3">
                    {detailBlocks.map((block) => (
                      <section
                        key={`${block.label}:${block.items.join("|")}`}
                        class={[
                          "rounded-xl border px-4 py-4",
                          blockToneClass(block.tone),
                        ]}
                      >
                        <h4 class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-subtle)]">
                          {block.label}
                        </h4>
                        <ul class="mt-3 space-y-2 text-sm leading-5 text-[color:var(--color-text)]">
                          {block.items.map((item) => (
                            <li key={item} class="flex gap-2">
                              <span
                                aria-hidden="true"
                                class="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--color-text-subtle)]"
                              />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    ))}
                  </div>
                ) : null}

                {props.note ? (
                  <p class="text-xs leading-5 text-[color:var(--color-text-muted)]">
                    {props.note}
                  </p>
                ) : null}
              </div>
            </aside>
          </div>
        ) : null}
      </>
    );
  },
);

const blockToneClass = (tone?: DecisionSummaryTone) => {
  if (tone === "positive") {
    return "border-[color:rgba(15,118,110,0.22)] bg-[color:rgba(15,118,110,0.05)]";
  }

  if (tone === "warning") {
    return "border-[color:rgba(180,83,9,0.24)] bg-[color:rgba(180,83,9,0.06)]";
  }

  if (tone === "critical") {
    return "border-[color:rgba(185,28,28,0.24)] bg-[color:rgba(185,28,28,0.06)]";
  }

  return "border-[color:var(--color-divider)] bg-white/70";
};

const caveatToneClass = (tone?: DecisionSummaryTone) => {
  if (tone === "critical") {
    return "border-[color:var(--color-error,#b91c1c)] bg-[color:rgba(185,28,28,0.07)]";
  }

  return "border-[color:var(--color-warning,#b45309)] bg-[color:rgba(180,83,9,0.08)]";
};

export type DecisionSummaryTone =
  | "default"
  | "positive"
  | "warning"
  | "critical";

export type DecisionSummaryBlock = {
  label: string;
  items: string[];
  tone?: DecisionSummaryTone;
};

export type DecisionSummaryCaveat = {
  title: string;
  summary?: string | null;
  message: string;
  tone?: DecisionSummaryTone;
};

type DecisionSummarySectionProps = {
  title?: string;
  eyebrow?: string;
  description?: string;
  badge?: string | null;
  blocks: DecisionSummaryBlock[];
  primaryBlockCount?: number;
  detailTitle?: string;
  detailCtaLabel?: string;
  caveat?: DecisionSummaryCaveat | null;
  note?: string | null;
};
