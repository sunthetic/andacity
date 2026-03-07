import { component$ } from '@builder.io/qwik'
import { Page } from '~/components/site/Page'

export const NotFoundPage = component$(() => {
  return (
    <Page>
      <div class="mx-auto max-w-3xl">
        <div class="t-card p-7">
          <div class="text-sm font-semibold text-[color:var(--color-text-strong)]">404</div>
          <h1 class="mt-2 text-balance text-3xl font-semibold tracking-tight text-[color:var(--color-text-strong)] lg:text-4xl">
            Page not found
          </h1>
          <p class="mt-2 text-sm text-[color:var(--color-text-muted)] lg:text-base">
            The link may be outdated, or the page may have moved.
          </p>

          <div class="mt-6 flex flex-wrap gap-2">
            <a class="t-btn-primary px-5 text-center" href="/">
              Home
            </a>
            <a class="t-badge px-5 text-center" href="/hotels">
              Hotels
            </a>
            <a class="t-badge px-5 text-center" href="/hotels/in">
              Cities
            </a>
            <a class="t-badge px-5 text-center" href="/search/hotels">
              Search hotels
            </a>
          </div>
        </div>
      </div>
    </Page>

  )
})
