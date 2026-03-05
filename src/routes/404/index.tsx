import { component$ } from '@builder.io/qwik'
import type { DocumentHead } from '@builder.io/qwik-city'
import { NotFoundPage } from '~/components/site/NotFoundPage'

export default component$(() => <NotFoundPage />)

export const head: DocumentHead = ({ url }) => {
  const title = '404 | Andacity Travel'
  const canonicalHref = new URL('/404', url.origin).href
  return {
    title,
    meta: [{ name: 'robots', content: 'noindex,follow' }],
    links: [{ rel: 'canonical', href: canonicalHref }],
  }
}
