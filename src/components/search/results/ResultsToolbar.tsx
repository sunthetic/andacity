import { component$ } from '@builder.io/qwik'
import type { QRL } from '@builder.io/qwik'

export const ResultsToolbar = component$((props: ResultsToolbarProps) => {
  return (
    <section class="mt-4 t-panel p-3 md:p-4">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div class="text-sm font-medium text-[color:var(--color-text)]">{props.resultCountLabel}</div>

        <div class="flex flex-wrap items-center gap-2">
          {props.onToggleFilters$ ? (
            <button class="t-btn-primary lg:hidden" type="button" onClick$={props.onToggleFilters$}>
              {props.mobileFiltersOpen ? 'Hide filters' : 'Show filters'}
            </button>
          ) : null}

          <label for={props.sortId} class="text-xs font-medium text-[color:var(--color-text-subtle)]">
            Sort
          </label>
          <select
            id={props.sortId}
            class="rounded-xl border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus-visible:shadow-[var(--ring-focus)]"
            value={props.sortValue}
            onChange$={(event) => {
              props.onSortChange$((event.target as HTMLSelectElement).value)
            }}
          >
            {props.sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  )
})

type ResultsToolbarProps = {
  resultCountLabel: string
  sortId: string
  sortValue: string
  sortOptions: { label: string; value: string }[]
  mobileFiltersOpen?: boolean
  onSortChange$: QRL<(value: string) => void>
  onToggleFilters$?: QRL<() => void>
}
