import { JSXOutput, Slot, component$ } from '@builder.io/qwik'
import { Breadcrumbs } from '~/components/navigation/Breadcrumbs'

export const VerticalHeroSearchLayout = component$((props: VerticalHeroSearchLayoutProps) => {
  const breadcrumbs = props.breadcrumbs ?? []
  
  return (
    <section class="relative overflow-hidden">
      <div class="mx-auto max-w-6xl px-4 py-10 md:py-14 lg:py-18">
        {breadcrumbs.length ? <Breadcrumbs items={breadcrumbs} /> : null}

        <div class="mx-auto max-w-4xl text-center">
          <p class="text-sm font-medium text-[color:var(--color-text-muted)]">
            {props.eyebrow}
          </p>

          <h1 class="mt-2 text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)] md:text-5xl">
            {props.title}
          </h1>

          <p class="mt-3 text-sm leading-6 text-[color:var(--color-text-muted)] md:text-base">
            {props.description}
          </p>

          <div class="mt-6">
            {props.searchCard}
          </div>

          {props.helperLinks?.length ? (
            <div class="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-[color:var(--color-text-muted)]">
              <span>Popular:</span>

              {props.helperLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  class="transition-colors hover:text-[color:var(--color-text-strong)]"
                >
                  {link.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <div class="mt-10">
          <Slot />
        </div>
      </div>
    </section>
  )
})

type VerticalHeroSearchLayoutProps = {
  breadcrumbs?: BreadcrumbItem[]
  eyebrow: string
  title: string
  description: string
  searchCard: JSXOutput
  helperLinks?: HelperLink[]
}

type BreadcrumbItem = {
  label: string
  href?: string
}

type HelperLink = {
  label: string
  href: string
}
