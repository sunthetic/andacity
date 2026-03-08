import { Slot, component$ } from '@builder.io/qwik'
import { ResultsEmpty } from '~/components/results/ResultsEmpty'
import { ResultsFilters } from '~/components/results/ResultsFilters'
import { ResultsHeader } from '~/components/results/ResultsHeader'
import { ResultsLoading } from '~/components/results/ResultsLoading'
import { ResultsPagination } from '~/components/results/ResultsPagination'
import type { ResultsPaginationLink } from '~/components/results/ResultsPagination'
import { ResultsSort } from '~/components/results/ResultsSort'
import type { ResultsSortOption } from '~/components/results/ResultsSort'

export const ResultsShell = component$((props: ResultsShellProps) => {
  return (
    <section class={props.class}>
      <ResultsHeader querySummary={props.querySummary} editSearchHref={props.editSearchHref} />

      <ResultsFilters mode="mobile" title={props.filtersTitle || 'Filters'} class="mt-4">
        <Slot name="filters-mobile" />
      </ResultsFilters>

      <div class="mt-6 grid gap-6 lg:grid-cols-[280px_1fr] lg:items-start">
        <aside class="hidden lg:block">
          <ResultsFilters title={props.filtersTitle || 'Filters'}>
            <Slot name="filters-desktop" />
          </ResultsFilters>
        </aside>

        <div>
          <ResultsSort resultCountLabel={props.resultCountLabel} options={props.sortOptions} />

          <div class="mt-4">
            {props.loading ? (
              <ResultsLoading />
            ) : props.empty ? (
              <ResultsEmpty
                title={props.empty.title}
                description={props.empty.description}
                primaryAction={props.empty.primaryAction}
                secondaryAction={props.empty.secondaryAction}
              />
            ) : (
              <Slot />
            )}
          </div>

          {!props.loading && !props.empty && props.pagination ? (
            <ResultsPagination
              page={props.pagination.page}
              totalPages={props.pagination.totalPages}
              prevHref={props.pagination.prevHref}
              nextHref={props.pagination.nextHref}
              pageLinks={props.pagination.pageLinks}
            />
          ) : null}
        </div>
      </div>
    </section>
  )
})

type ResultsShellProps = {
  querySummary: string
  resultCountLabel: string
  sortOptions: ResultsSortOption[]
  pagination?: {
    page: number
    totalPages: number
    prevHref?: string
    nextHref?: string
    pageLinks: ResultsPaginationLink[]
  }
  editSearchHref?: string
  filtersTitle?: string
  loading?: boolean
  empty?: {
    title: string
    description: string
    primaryAction?: {
      label: string
      href: string
    }
    secondaryAction?: {
      label: string
      href: string
    }
  }
  class?: string
}
