import type { RequestHandler } from '@builder.io/qwik-city'
import { getPublicBaseUrl, shouldIndex } from '~/lib/seo/env'

export const onGet: RequestHandler = ({ url, headers, send, cacheControl }) => {
  const baseUrl = getPublicBaseUrl(url)
  const prod = shouldIndex(baseUrl)

  headers.set('content-type', 'application/xml; charset=utf-8')

  if (prod) {
    cacheControl({
      public: true,
      maxAge: 60 * 10,
      sMaxAge: 60 * 60 * 12,
      staleWhileRevalidate: 60 * 60 * 24 * 7,
    })
  } else {
    headers.set('cache-control', 'no-store')
  }

  const origin = baseUrl.origin

  const sitemaps = [
    { loc: `${origin}/sitemaps/destinations/1.xml` },
    { loc: `${origin}/sitemaps/hotels/1.xml` },
  ]

  send(200, sitemapIndexXml(sitemaps))
}

const sitemapIndexXml = (items: { loc: string; lastmod?: string }[]) => {
  const now = new Date().toISOString()

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items
      .map((x) => `  <sitemap>
    <loc>${escapeXml(x.loc)}</loc>
    <lastmod>${escapeXml(x.lastmod || now)}</lastmod>
  </sitemap>`)
      .join('\n')}
</sitemapindex>
`
}

const escapeXml = (s: string) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
