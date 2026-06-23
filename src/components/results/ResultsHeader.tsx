import { component$ } from '@builder.io/qwik'

export const ResultsHeader = component$((props: ResultsHeaderProps) => {
  return (
    <header
      class="overflow-hidden rounded-xl p-4 md:p-5"
      style="background:var(--ui-surface);border:1px solid var(--ui-border);box-shadow:var(--ui-shadow-card)"
    >
      <p class="text-xs font-semibold uppercase tracking-[0.08em]" style="color:var(--ui-text-muted)">
        Results
      </p>

      <div class="mt-2 flex flex-wrap items-start justify-between gap-3">
        <h2 class="max-w-[46rem] text-balance text-xl font-semibold tracking-tight md:text-2xl" style="color:var(--ui-text)">
          {props.querySummary}
        </h2>

        {props.editSearchHref ? (
          <a
            class="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition"
            style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text-muted)"
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
