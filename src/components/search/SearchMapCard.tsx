import { component$ } from '@builder.io/qwik'

export const SearchMapCard = component$((props: SearchMapCardProps) => {
  const badge = props.badge || 'Preview'
  const title = props.title || 'Map'
  const description = props.description || 'Map supports decision-making; keep it compact.'

  return (
    <div class="t-card p-5">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">{title}</div>
          <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">{description}</div>
        </div>
        <span class="t-badge">{badge}</span>
      </div>

      <div class="mt-4 h-56 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-neutral-50)]" />
    </div>
  )
})

/* -----------------------------
  Types
----------------------------- */

type SearchMapCardProps = {
  title?: string
  description?: string
  badge?: string
}
