import { component$ } from '@builder.io/qwik'

export const Breadcrumbs = component$((props: BreadcrumbsProps) => {
  const items = props.items || []

  return (
    <nav aria-label="Breadcrumbs">
      <div class="flex flex-wrap items-center gap-2 text-sm text-[color:var(--color-text-muted)]">
        {items.map((it, i) => (
          <>
            {i > 0 ? <span class="text-[color:var(--color-text-subtle)]">/</span> : null}
            {i === items.length - 1 ? (
              <span class="text-[color:var(--color-text)]">{it.label}</span>
            ) : (
              <a class="hover:text-[color:var(--color-text)]" href={it.href}>
                {it.label}
              </a>
            )}
          </>
        ))}
      </div>
    </nav>
  )
})

/* -----------------------------
   Types
----------------------------- */

export type BreadcrumbItem = {
  label: string
  href: string
}

export type BreadcrumbsProps = {
  items: BreadcrumbItem[]
}
