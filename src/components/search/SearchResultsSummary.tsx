import { component$ } from '@builder.io/qwik'

export const SearchResultsSummary = component$((props: SearchResultsSummaryProps) => {
  return (
    <div class="flex items-center justify-between">
      <div class="text-sm text-[color:var(--color-text-muted)]">
        Showing <span class="font-medium text-[color:var(--color-text)]">{props.shown}</span> of{' '}
        <span class="font-medium text-[color:var(--color-text)]">{props.total.toLocaleString('en-US')}</span>
      </div>

      <div class="text-sm text-[color:var(--color-text-muted)]">
        Page <span class="font-medium text-[color:var(--color-text)]">{props.page}</span> / {props.totalPages}
      </div>
    </div>
  )
})

/* -----------------------------
  Types
----------------------------- */

type SearchResultsSummaryProps = {
  shown: number
  total: number
  page: number
  totalPages: number
}
