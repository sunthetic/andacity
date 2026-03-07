import { Slot, component$ } from '@builder.io/qwik'
import { Breadcrumbs } from '~/components/navigation/Breadcrumbs'

export const Page = component$((props: PageProps) => {
  const breadcrumbs = props.breadcrumbs ?? []

  return (
    <>
      {/* Breadcrumb band (edge-aligned) */}
      {breadcrumbs.length ? (
        <div class="borde3r-b border-[color:var(--color-border)]">
          <div class="mx-auto max-w-6xl px-4 py-3.5">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        </div>
      ) : null}

      {/* Main page container */}
      <main class="mx-auto max-w-6xl px-4 pt-5 pb-10 md:pb-12.5 lg:pb-16">
        <Slot />
      </main>
    </>
  )
})

type BreadcrumbItem = {
  label: string
  href?: string
}

type PageProps = {
  breadcrumbs?: BreadcrumbItem[]
}
