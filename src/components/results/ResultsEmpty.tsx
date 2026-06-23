import { component$ } from '@builder.io/qwik'

export const ResultsEmpty = component$((props: ResultsEmptyProps) => {
  return (
    <div
      class="rounded-xl p-6 text-center md:p-8"
      style="background:var(--ui-surface);border:1px solid var(--ui-border);box-shadow:var(--ui-shadow-card)"
    >
      <h3 class="text-balance text-lg font-semibold" style="color:var(--ui-text)">{props.title}</h3>
      <p class="mx-auto mt-2 max-w-[56ch] text-sm" style="color:var(--ui-text-muted)">{props.description}</p>

      <div class="mt-5 flex flex-wrap items-center justify-center gap-2">
        {props.primaryAction ? (
          <a class="t-btn-primary px-5 text-center" href={props.primaryAction.href}>
            {props.primaryAction.label}
          </a>
        ) : null}
        {props.secondaryAction ? (
          <a class="t-btn-ghost px-5 text-center" href={props.secondaryAction.href}>
            {props.secondaryAction.label}
          </a>
        ) : null}
      </div>
    </div>
  )
})

type ResultsEmptyProps = {
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
