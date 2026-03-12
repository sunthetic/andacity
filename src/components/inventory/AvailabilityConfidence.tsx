import { component$ } from '@builder.io/qwik'
import {
  availabilityConfidenceBadgeClass,
  type AvailabilityConfidenceModel,
} from '~/lib/inventory/availability-confidence'

export const AvailabilityConfidence = component$(
  (props: AvailabilityConfidenceProps) => {
    if (!props.confidence) return null

    const alignmentClass =
      props.align === 'right' ? 'items-end text-right' : 'items-start text-left'
    const compact = props.compact !== false
    const detailClass = compact ? 'text-[11px]' : 'text-xs'
    const showSupport =
      props.showSupport != null ? props.showSupport : props.confidence.degraded

    return (
      <div class={['flex flex-col gap-1', alignmentClass]}>
        <div
          class={[
            'flex flex-wrap items-center gap-2',
            props.align === 'right' ? 'justify-end' : 'justify-start',
          ]}
        >
          <span
            class={availabilityConfidenceBadgeClass(props.confidence.state)}
            title={props.confidence.supportText || undefined}
          >
            {props.confidence.label}
          </span>
        </div>

        {showSupport && props.confidence.supportText ? (
          <p class={[detailClass, 'text-[color:var(--color-text-muted)]']}>
            {props.confidence.supportText}
          </p>
        ) : null}

        {props.showDetail === false ? null : (
          <p class={[detailClass, 'text-[color:var(--color-text-muted)]']}>
            {props.confidence.detailLabel}
          </p>
        )}

        {props.note ? (
          <p class={[detailClass, 'text-[color:var(--color-text-muted)]']}>
            {props.note}
          </p>
        ) : null}
      </div>
    )
  },
)

type AvailabilityConfidenceProps = {
  confidence?: AvailabilityConfidenceModel | null
  compact?: boolean
  align?: 'left' | 'right'
  showDetail?: boolean
  showSupport?: boolean
  note?: string
}
