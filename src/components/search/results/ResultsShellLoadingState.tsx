import { component$ } from "@builder.io/qwik";
import { ResultsLoading } from "~/components/results/ResultsLoading";

const SkeletonLine = component$((props: { class?: string }) => (
  <div
    aria-hidden="true"
    class={[
      "animate-pulse rounded-full bg-[color:var(--color-neutral-100)]",
      props.class,
    ]}
  />
));

export const ResultsShellLoadingState = component$(
  (props: ResultsShellLoadingStateProps) => {
    return (
      <div aria-busy="true" aria-live="polite" class="grid gap-6">
        <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-4 shadow-[var(--shadow-sm)] md:p-5">
          <SkeletonLine class="h-3 w-20" />
          <div class="mt-2 flex flex-wrap items-start justify-between gap-3">
            <SkeletonLine class="h-10 w-2/3 max-w-[28rem] rounded-2xl" />
            <SkeletonLine class="h-8 w-28 rounded-full" />
          </div>
        </section>

        <section
          class="sticky z-20"
          style={{ top: "var(--sticky-top-offset)" }}
        >
          <div class="rounded-[var(--radius-xl)] border border-[color:var(--color-border-subtle)] bg-[color:rgba(255,255,255,0.92)] shadow-[var(--shadow-sm)] backdrop-blur">
            <div class="flex flex-col gap-3 p-3 md:p-4">
              <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <SkeletonLine class="h-5 w-36" />
                <div class="flex flex-wrap items-center gap-2">
                  <SkeletonLine class="h-10 w-24 rounded-full" />
                  <SkeletonLine class="h-10 w-28 rounded-full" />
                  <SkeletonLine class="h-4 w-8" />
                  <SkeletonLine class="h-10 w-40 rounded-xl" />
                </div>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <SkeletonLine
                    key={`active-filter-chip-skeleton-${index}`}
                    class="h-8 w-32 rounded-full"
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <div class="grid gap-6 lg:grid-cols-[280px_1fr] lg:items-start">
          <aside class="hidden lg:block">
            <section class="rounded-[var(--radius-xl)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
              <div class="flex items-center justify-between gap-3">
                <SkeletonLine class="h-5 w-20" />
                <SkeletonLine class="h-4 w-16" />
              </div>
              <div class="mt-4 grid gap-5">
                {Array.from({ length: 4 }).map((_, sectionIndex) => (
                  <section key={`sidebar-filter-skeleton-${sectionIndex}`}>
                    <SkeletonLine class="h-3 w-24" />
                    <div class="mt-3 flex flex-wrap gap-2">
                      {Array.from({ length: 4 }).map((__, optionIndex) => (
                        <SkeletonLine
                          key={`sidebar-filter-option-skeleton-${sectionIndex}-${optionIndex}`}
                          class="h-8 w-24 rounded-full"
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </section>
          </aside>

          <section>
            <p class="sr-only">
              {props.title}. {props.description}
            </p>
            <ResultsLoading variant={props.variant} count={props.placeholderCount} />
          </section>
        </div>
      </div>
    );
  },
);

type ResultsShellLoadingStateProps = {
  title: string;
  description: string;
  placeholderCount: number;
  variant?: "card" | "list";
};
