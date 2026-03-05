import { component$, Slot } from '@builder.io/qwik'

export const SearchHeaderBar = component$((props: SearchHeaderBarProps) => {
  return (
    <div class="mt-4 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
      <div>
        <h1 class="text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)] lg:text-4xl">
          {props.title}
        </h1>

        <p class="mt-2 max-w-[80ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
          {props.description}
        </p>

        <div class="mt-3 flex flex-wrap gap-2">
          <Slot name="badges" />
        </div>
      </div>

      <div class="hidden lg:block">
        <Slot name="sort" />
      </div>
    </div>
  )
})

/* -----------------------------
  Types
----------------------------- */

type SearchHeaderBarProps = {
  title: string
  description: string
}
