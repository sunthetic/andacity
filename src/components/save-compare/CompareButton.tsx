import { component$, type QRL } from '@builder.io/qwik'

export const CompareButton = component$((props: CompareButtonProps) => {
  const base =
    'inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold transition'
  const stateClass = props.selected
    ? 'border-[color:var(--color-accent-700,var(--color-action))] bg-[color:rgba(37,99,235,0.08)] text-[color:var(--color-accent-700,var(--color-action))]'
    : 'border-[color:var(--color-border)] text-[color:var(--color-text-muted)] hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-text-strong)]'

  return (
    <button
      type="button"
      aria-pressed={props.selected}
      disabled={props.disabled}
      onClick$={props.onToggle$}
      class={[base, stateClass, props.class, props.disabled ? 'cursor-not-allowed opacity-60' : null]}
    >
      {props.selected ? props.activeLabel || 'Selected' : props.idleLabel || 'Compare'}
    </button>
  )
})

type CompareButtonProps = {
  selected: boolean
  onToggle$: QRL<() => void>
  class?: string
  idleLabel?: string
  activeLabel?: string
  disabled?: boolean
}
