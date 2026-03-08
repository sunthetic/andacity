import type { RequestHandler } from '@builder.io/qwik-city'
import { HOTELS } from '~/data/hotels'
import { getPublicBaseUrl, shouldIndex } from '~/lib/seo/env'

export const onGet: RequestHandler = ({ params, url, headers, send, cacheControl }) => {
  const baseUrl = getPublicBaseUrl(url)
  const prod = shouldIndex(baseUrl)
  const pageSize = 1000
  const totalPages = Math.max(1, Math.ceil(HOTELS.length / pageSize))

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

  const page = parsePage(params.page)
  if (page == null || page > totalPages) {
    send(404, 'Not found')
    return
  }

  const origin = baseUrl.origin

  const start = (page - 1) * pageSize
  const urls = HOTELS.slice(start, start + pageSize).map((h) => ({
    loc: `${origin}/hotels/${encodeURIComponent(h.slug)}`,
    changefreq: 'daily' as const,
    priority: 0.8,
  }))

  send(200, urlsetXml(urls))
}

const urlsetXml = (items: { loc: string; lastmod?: string; changefreq?: string; priority?: number }[]) => {
  const now = new Date().toISOString()

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items
      .map((x) => `  <url>
    <loc>${escapeXml(x.loc)}</loc>
    <lastmod>${escapeXml(x.lastmod || now)}</lastmod>
    ${x.changefreq ? `<changefreq>${escapeXml(x.changefreq)}</changefreq>` : ''}
    ${typeof x.priority === 'number' ? `<priority>${x.priority.toFixed(1)}</priority>` : ''}
  </url>`)
      .join('\n')}
</urlset>
`
}

const parsePage = (raw: string | undefined) => {
  const n = Number.parseInt(String(raw || ''), 10)
  if (!Number.isFinite(n) || n < 1) return null
  return n
}

const escapeXml = (s: string) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
