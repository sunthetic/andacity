import { component$ } from '@builder.io/qwik'

export const ResultsHeader = component$((props: ResultsHeaderProps) => {
  return (
    <header class="overflow-hidden rounded-[var(--radius-xl)] bg-[linear-gradient(135deg,var(--color-primary-600),var(--color-route),var(--color-secondary-600))] p-4 text-white shadow-[var(--shadow-lg)] md:p-5">
      <p class="text-xs font-semibold uppercase tracking-[0.08em] text-white/76">
        Results
      </p>

      <div class="mt-2 flex flex-wrap items-start justify-between gap-3">
        <h2 class="max-w-[46rem] text-balance text-xl font-semibold tracking-tight text-white md:text-2xl">
          {props.querySummary}
        </h2>

        {props.editSearchHref ? (
          <a
            class="inline-flex items-center rounded-full bg-white/18 px-3 py-1.5 text-xs font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition hover:bg-white/26"
            href={props.editSearchHref}
          >
            {props.editSearchLabel || 'Edit search'}
          </a>
        ) : null}
      </div>
    </header>
  )
})

type ResultsHeaderProps = {
  querySummary: string
  editSearchHref?: string
  editSearchLabel?: string
}
