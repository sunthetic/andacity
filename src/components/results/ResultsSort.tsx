import { component$ } from '@builder.io/qwik'

export const ResultsSort = component$((props: ResultsSortProps) => {
  return (
    <div class="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-xl)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-4 py-3 shadow-[var(--shadow-sm)]">
      <p class="text-sm text-[color:var(--color-text-muted)]">{props.resultCountLabel}</p>

      <div class="flex flex-wrap items-center gap-2">
        {props.options.map((option) => (
          <a
            key={option.value}
            href={option.href}
            class={[
              'rounded-full border px-3 py-1 text-xs font-medium transition',
              option.active
                ? 'border-[color:var(--color-action)] bg-[color:var(--color-primary-50)] text-[color:var(--color-action)]'
                : 'border-[color:var(--color-border-default)] bg-[color:var(--color-surface-elevated)] text-[color:var(--color-text)] hover:bg-white',
            ]}
            aria-current={option.active ? 'page' : undefined}
          >
            {option.label}
          </a>
        ))}
      </div>
    </div>
  )
})

export type ResultsSortOption = {
  label: string
  value: string
  href: string
  active?: boolean
}

type ResultsSortProps = {
  resultCountLabel: string
  options: ResultsSortOption[]
}
