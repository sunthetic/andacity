import { component$ } from '@builder.io/qwik'
import type { DocumentHead, RequestHandler } from '@builder.io/qwik-city'
import { NotFoundPage } from '~/components/site/NotFoundPage'

export const onGet: RequestHandler = ({ status }) => {
  status(404)
}

export default component$(() => {
  return <NotFoundPage />
})

export const head: DocumentHead = ({ url }) => {
  const title = '404 | Andacity Travel'
  const description = 'Page not found.'
  const canonicalHref = new URL(url.pathname, url.origin).href

  return {
    title,
    meta: [
      { name: 'description', content: description },
      { name: 'robots', content: 'noindex,follow' },
      { property: 'og:type', content: 'website' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonicalHref },
    ],
  }
}
