import { component$ } from '@builder.io/qwik'
import type { DocumentHead } from '@builder.io/qwik-city'

export default component$(() => {
  return (
    <div class="mx-auto max-w-6xl px-4 py-10">
      <div class="t-card p-7">
        <h1 class="text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)] lg:text-4xl">
          Car rentals (coming soon)
        </h1>
        <p class="mt-2 max-w-[70ch] text-sm text-[color:var(--color-text-muted)] lg:text-base">
          We’re building the car rentals vertical next.
        </p>
      </div>
    </div>
  )
})

export const head: DocumentHead = ({ url }) => {
  const title = 'Car rentals | Andacity Travel'
  const description = 'Car rentals vertical coming soon.'
  return {
    title,
    meta: [{ name: 'description', content: description }],
    links: [{ rel: 'canonical', href: new URL('/car-rentals', url.origin).href }],
  }
}
