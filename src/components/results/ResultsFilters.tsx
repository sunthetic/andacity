import { Slot, component$ } from '@builder.io/qwik'

export const ResultsFilters = component$((props: ResultsFiltersProps) => {
  if (props.mode === 'mobile') {
    return (
      <details class={['rounded-[var(--radius-xl)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] shadow-[var(--shadow-sm)] lg:hidden', props.class]}>
        <summary class="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-[color:var(--color-text-strong)]">
          {props.title || 'Filters'}
        </summary>
        <div class="border-t border-[color:var(--color-border-subtle)] p-4">
          <Slot />
        </div>
      </details>
    )
  }

  return (
    <section class={['rounded-[var(--radius-xl)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-4 shadow-[var(--shadow-sm)]', props.class]}>
      <h3 class="text-sm font-semibold text-[color:var(--color-text-strong)]">{props.title || 'Filters'}</h3>
      <div class="mt-3">
        <Slot />
      </div>
    </section>
  )
})

type ResultsFiltersProps = {
  title?: string
  mode?: 'desktop' | 'mobile'
  class?: string
}
