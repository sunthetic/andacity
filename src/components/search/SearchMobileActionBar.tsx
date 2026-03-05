import { component$ } from '@builder.io/qwik'

export const SearchMobileActionBar = component$((props: SearchMobileActionBarProps) => {
  return (
    <div class="fixed inset-x-0 bottom-0 z-50 border-t border-[color:var(--color-divider)] bg-white/95 backdrop-blur lg:hidden">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div class="min-w-0">
          <div class="truncate text-sm font-semibold text-[color:var(--color-text-strong)]">{props.title}</div>
          <div class="text-xs text-[color:var(--color-text-muted)]">
            {props.total.toLocaleString('en-US')} results
            {props.meta ? <span> · {props.meta}</span> : null}
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button type="button" class="t-badge hover:bg-white" onClick$={props.onSortOpen$}>
            Sort
          </button>

          <button type="button" class="t-btn-primary px-5" onClick$={props.onFiltersOpen$}>
            Filters
            {props.hasActiveFilters ? <span class="ml-2 t-badge">•</span> : null}
          </button>
        </div>
      </div>
    </div>
  )
})

/* -----------------------------
  Types
----------------------------- */

type SearchMobileActionBarProps = {
  title: string
  total: number
  meta?: string | null
  hasActiveFilters: boolean
  onSortOpen$: () => void
  onFiltersOpen$: () => void
}
