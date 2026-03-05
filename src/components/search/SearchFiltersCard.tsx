import { component$, Slot } from '@builder.io/qwik'

export const SearchFiltersCard = component$((props: SearchFiltersCardProps) => {
  return (
    <aside class="hidden lg:block lg:sticky lg:top-24 lg:self-start">
      <div class="t-card p-5">
        <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">{props.title}</div>
        <div class="mt-1 text-xs text-[color:var(--color-text-muted)]">{props.description}</div>

        <form method="get" action={props.action} class="mt-4 grid gap-4">
          {props.sortValue ? <input type="hidden" name="sort" value={props.sortValue} /> : null}

          <Slot />

          <div class="text-xs text-[color:var(--color-text-muted)]">
            {props.footerNote}
          </div>
        </form>
      </div>
    </aside>
  )
})

/* -----------------------------
  Types
----------------------------- */

type SearchFiltersCardProps = {
  title: string
  description: string
  action: string
  sortValue?: string
  footerNote: string
}
