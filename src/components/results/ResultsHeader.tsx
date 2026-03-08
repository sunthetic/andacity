import { component$ } from '@builder.io/qwik'

export const ResultsHeader = component$((props: ResultsHeaderProps) => {
  return (
    <header class="rounded-[var(--radius-xl)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-4 shadow-[var(--shadow-sm)] md:p-5">
      <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
        Results
      </p>

      <div class="mt-2 flex flex-wrap items-start justify-between gap-3">
        <h2 class="text-balance text-xl font-semibold tracking-tight text-[color:var(--color-text-strong)] md:text-2xl">
          {props.querySummary}
        </h2>

        {props.editSearchHref ? (
          <a
            class="inline-flex items-center rounded-full border border-[color:var(--color-border-default)] bg-[color:var(--color-surface-elevated)] px-3 py-1.5 text-xs font-medium text-[color:var(--color-text-strong)] transition hover:bg-white"
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
