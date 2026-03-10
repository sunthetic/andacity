import { component$ } from '@builder.io/qwik'
import type { InventoryFreshnessModel, InventoryFreshnessState } from '~/lib/inventory/freshness'

export const InventoryFreshness = component$((props: InventoryFreshnessProps) => {
  if (!props.freshness) return null

  const alignmentClass = props.align === 'right' ? 'items-end text-right' : 'items-start text-left'
  const compact = props.compact !== false
  const detailClass = compact ? 'text-[11px]' : 'text-xs'

  return (
    <div class={['flex flex-col gap-1', alignmentClass]}>
      <div class={['flex flex-wrap items-center gap-2', props.align === 'right' ? 'justify-end' : 'justify-start']}>
        <span class={freshnessBadgeClass(props.freshness.state)}>
          {props.freshness.label}
        </span>
        {props.freshness.stale ? (
          <span class="rounded-full border border-[color:var(--color-error,#b91c1c)] bg-[color:rgba(185,28,28,0.08)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-[color:var(--color-error,#b91c1c)]">
            Stale
          </span>
        ) : null}
      </div>

      {props.showDetail === false ? null : (
        <p class={[detailClass, 'text-[color:var(--color-text-muted)]']}>
          {props.freshness.detailLabel}
        </p>
      )}

      {props.note ? (
        <p class={[detailClass, 'text-[color:var(--color-text-muted)]']}>{props.note}</p>
      ) : null}
    </div>
  )
})

const freshnessBadgeClass = (state: InventoryFreshnessState) => {
  if (state === 'just_checked') {
    return 'rounded-full border border-[color:var(--color-success,#0f766e)] bg-[color:rgba(15,118,110,0.08)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-[color:var(--color-success,#0f766e)]'
  }

  if (state === 'checked_recently') {
    return 'rounded-full border border-[color:var(--color-action)] bg-[color:rgba(14,116,144,0.08)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-[color:var(--color-action)]'
  }

  if (state === 'aging') {
    return 'rounded-full border border-[color:var(--color-warning,#b45309)] bg-[color:rgba(180,83,9,0.08)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-[color:var(--color-warning,#92400e)]'
  }

  return 'rounded-full border border-[color:var(--color-error,#b91c1c)] bg-[color:rgba(185,28,28,0.08)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-[color:var(--color-error,#b91c1c)]'
}

type InventoryFreshnessProps = {
  freshness?: InventoryFreshnessModel | null
  compact?: boolean
  align?: 'left' | 'right'
  showDetail?: boolean
  note?: string
}
