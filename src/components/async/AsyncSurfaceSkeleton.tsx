import { component$ } from "@builder.io/qwik";

const SkeletonLine = component$((props: { class?: string }) => (
  <div
    aria-hidden="true"
    class={[
      "animate-pulse rounded-full bg-[color:var(--color-neutral-100)]",
      props.class,
    ]}
  />
));

export const CardSkeleton = component$(() => {
  return (
    <article class="t-card overflow-hidden" aria-hidden="true">
      <div class="h-40 animate-pulse bg-[color:var(--color-neutral-75)]" />
      <div class="grid gap-3 p-4">
        <SkeletonLine class="h-4 w-2/3" />
        <SkeletonLine class="h-3 w-1/2" />
        <div class="flex flex-wrap gap-2">
          <SkeletonLine class="h-6 w-20 rounded-full" />
          <SkeletonLine class="h-6 w-24 rounded-full" />
          <SkeletonLine class="h-6 w-16 rounded-full" />
        </div>
        <SkeletonLine class="h-3 w-full" />
        <SkeletonLine class="h-3 w-5/6" />
      </div>
    </article>
  );
});

export const ListSkeleton = component$((props: { count?: number }) => {
  const count = props.count || 3;

  return (
    <div class="grid gap-3">
      {Array.from({ length: count }).map((_, index) => (
        <article
          key={`list-skeleton-${index}`}
          class="rounded-[var(--radius-xl)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-4 shadow-[var(--shadow-sm)]"
          aria-hidden="true"
        >
          <div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
            <div class="grid gap-3">
              <SkeletonLine class="h-4 w-2/5" />
              <SkeletonLine class="h-3 w-1/3" />
              <div class="flex flex-wrap gap-2">
                <SkeletonLine class="h-6 w-18 rounded-full" />
                <SkeletonLine class="h-6 w-24 rounded-full" />
                <SkeletonLine class="h-6 w-20 rounded-full" />
              </div>
              <SkeletonLine class="h-3 w-full" />
              <SkeletonLine class="h-3 w-4/5" />
            </div>

            <div class="grid content-start gap-3">
              <SkeletonLine class="ml-auto h-8 w-24 rounded-xl" />
              <SkeletonLine class="ml-auto h-4 w-28" />
              <SkeletonLine class="ml-auto h-3 w-24" />
              <SkeletonLine class="ml-auto h-10 w-36 rounded-xl" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
});

export const DetailSkeleton = component$(() => {
  return (
    <section class="grid gap-6" aria-hidden="true">
      <div class="grid gap-3">
        <SkeletonLine class="h-4 w-28" />
        <SkeletonLine class="h-10 w-3/5 rounded-2xl" />
        <SkeletonLine class="h-4 w-2/5" />
      </div>

      <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div class="grid gap-4">
          <div class="h-72 animate-pulse rounded-[var(--radius-xl)] bg-[color:var(--color-neutral-75)] lg:h-96" />
          <div class="grid gap-3 rounded-[var(--radius-xl)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
            <SkeletonLine class="h-4 w-1/4" />
            <SkeletonLine class="h-3 w-full" />
            <SkeletonLine class="h-3 w-5/6" />
            <SkeletonLine class="h-3 w-2/3" />
          </div>
        </div>

        <div class="grid gap-4">
          <div class="grid gap-3 rounded-[var(--radius-xl)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
            <SkeletonLine class="h-5 w-1/3" />
            <SkeletonLine class="h-8 w-2/3 rounded-xl" />
            <SkeletonLine class="h-3 w-full" />
            <SkeletonLine class="h-10 w-full rounded-xl" />
          </div>
          <div class="grid gap-3 rounded-[var(--radius-xl)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-sm)]">
            <SkeletonLine class="h-4 w-1/4" />
            <SkeletonLine class="h-3 w-full" />
            <SkeletonLine class="h-3 w-5/6" />
          </div>
        </div>
      </div>
    </section>
  );
});
