import { component$ } from "@builder.io/qwik";
import { ResultsLoading } from "~/components/results/ResultsLoading";
import type { HotelResultsLoadingStateModel } from "~/types/search-ui";

const SkeletonLine = component$((props: { class?: string }) => (
  <div
    aria-hidden="true"
    class={[
      "animate-pulse rounded-full bg-[color:var(--color-neutral-100)]",
      props.class,
    ]}
  />
));

export const HotelResultsLoadingState = component$((props: HotelResultsLoadingStateProps) => {
  return (
    <div aria-busy="true" aria-live="polite" class="grid gap-6">
      <section class="t-card p-5 md:p-6">
        <SkeletonLine class="h-3 w-28" />
        <SkeletonLine class="mt-4 h-10 w-2/3 max-w-[28rem]" />

        <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`hotel-summary-skeleton-${index}`}
              class="rounded-2xl bg-[color:var(--color-neutral-50)] px-4 py-3"
            >
              <SkeletonLine class="h-3 w-16" />
              <SkeletonLine class="mt-3 h-4 w-24" />
            </div>
          ))}
        </div>

        <div class="mt-5 flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonLine
              key={`hotel-badge-skeleton-${index}`}
              class="h-8 w-32 rounded-full"
            />
          ))}
        </div>
      </section>

      <section>
        <p class="sr-only">
          {props.model.title}. {props.model.description}
        </p>
        <ResultsLoading variant="list" count={props.model.placeholderCount} />
      </section>
    </div>
  );
});

type HotelResultsLoadingStateProps = {
  model: HotelResultsLoadingStateModel;
};
