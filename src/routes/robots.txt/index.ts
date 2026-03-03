import type { RequestHandler } from '@builder.io/qwik-city'
import { getPublicBaseUrl, shouldIndex } from '~/lib/seo/env'

export const onGet: RequestHandler = ({ url, headers, send }) => {
  const baseUrl = getPublicBaseUrl(url)
  const prod = shouldIndex(baseUrl)

  headers.set('content-type', 'text/plain; charset=utf-8')

  if (!prod) {
    // Hard block all crawling in staging/previews/local
    send(
      200,
      [
        'User-agent: *',
        'Disallow: /',
        '',
        `Sitemap: ${new URL('/sitemap.xml', baseUrl).href}`,
        '',
      ].join('\n')
    )
    return
  }

  // Prod crawl policy:
  // - Disallow search (infinite permutations)
  // - Allow indexables: destinations + hotels + marketing pages
  send(
    200,
    [
      'User-agent: *',
      'Disallow: /search/',
      'Disallow: /og/',
      'Disallow: /api/',
      '',
      `Sitemap: ${new URL('/sitemap.xml', baseUrl).href}`,
      '',
    ].join('\n')
  )
}
