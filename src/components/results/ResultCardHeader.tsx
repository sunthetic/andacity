import { Slot, component$, type QRL } from '@builder.io/qwik'

const formatMoney = (amount: number | null | undefined, currency: string | null | undefined) => {
  if (!Number.isFinite(amount) || !currency) return null

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(amount))
  } catch {
    return `${Math.round(Number(amount))} ${currency}`
  }
}

export const ResultCardHeader = component$((props: ResultCardHeaderProps) => {
  const compactPrice = props.hasActions ? formatMoney(props.price, props.currency) : null

  return (
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        {props.href ? (
          <a
            href={props.href}
            onClick$={props.onClick$}
            class="text-lg font-semibold leading-6 transition hover:underline"
            style="color:var(--ui-text)"
          >
            {props.title}
          </a>
        ) : (
          <div class="text-lg font-semibold leading-6" style="color:var(--ui-text)">
            {props.title}
          </div>
        )}
        {props.subtitle ? (
          <p class="mt-1 text-sm" style="color:var(--ui-text-muted)">{props.subtitle}</p>
        ) : null}
      </div>

      {compactPrice || props.hasActions ? (
        <div class="flex min-w-fit items-start gap-2 md:hidden">
          {compactPrice ? (
            <div class="rounded-full px-3 py-1 text-xs font-semibold" style="background:var(--ui-surface-muted);border:1px solid var(--ui-border);color:var(--ui-text)">
              {compactPrice}
            </div>
          ) : null}
          {props.hasActions ? (
            <div class="flex gap-2">
              <Slot name="save-action" />
              <Slot name="trip-action" />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
})

type ResultCardHeaderProps = {
  title: string
  subtitle?: string | null
  price?: number | null
  currency?: string | null
  href?: string
  hasActions?: boolean
  onClick$?: QRL<() => void>
}
