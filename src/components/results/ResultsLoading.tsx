import { component$ } from '@builder.io/qwik'

export const ResultsLoading = component$(() => {
  return (
    <div class="grid gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={`skeleton-${i}`}
          class="h-40 animate-pulse rounded-[var(--radius-xl)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-neutral-50)]"
          aria-hidden="true"
        />
      ))}
    </div>
  )
})
