import { component$ } from '@builder.io/qwik'

export const Breadcrumbs = component$((props: BreadcrumbsProps) => {
  const items = props.items ?? []
  if (!items.length) return null

  return (
    <nav aria-label="Breadcrumb" class="mb-4">
      <ol class="flex flex-wrap items-center gap-2 text-sm text-[color:var(--color-text-muted)]">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} class="flex items-center gap-2">
              {item.href && !isLast ? (
                <a
                  href={item.href}
                  class="transition-colors hover:text-[color:var(--color-text-strong)]"
                >
                  {item.label}
                </a>
              ) : (
                <span aria-current={isLast ? 'page' : undefined}>{item.label}</span>
              )}
              {!isLast ? <span aria-hidden="true">/</span> : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
})

type BreadcrumbItem = {
  label: string
  href?: string
}

type BreadcrumbsProps = {
  items?: BreadcrumbItem[]
}
