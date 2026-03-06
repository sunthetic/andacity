import { component$ } from '@builder.io/qwik'

export type SearchEmptyStateProps = {
  title: string
  description: string
  primaryAction: {
    label: string
    href: string
  }
  secondaryAction?: {
    label: string
    href: string
  }
}

export const SearchEmptyState = component$((props: SearchEmptyStateProps) => {
  return (
    <div class="rounded-[var(--radius-xl)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-6 text-center shadow-[var(--shadow-sm)] md:p-8">
      <h2 class="text-balance text-lg font-semibold text-[color:var(--color-text-strong)]">{props.title}</h2>
      <p class="mx-auto mt-2 max-w-[56ch] text-sm text-[color:var(--color-text-muted)]">{props.description}</p>

      <div class="mt-5 flex flex-wrap items-center justify-center gap-2">
        <a class="t-btn-primary px-5 text-center" href={props.primaryAction.href}>
          {props.primaryAction.label}
        </a>
        {props.secondaryAction ? (
          <a class="t-btn-ghost px-5 text-center" href={props.secondaryAction.href}>
            {props.secondaryAction.label}
          </a>
        ) : null}
      </div>
    </div>
  )
})
