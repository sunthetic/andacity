import type { RequestHandler } from '@builder.io/qwik-city'
import { HOTELS } from '~/data/hotels'
import { getPublicBaseUrl, shouldIndex } from '~/lib/seo/env'

export const onGet: RequestHandler = ({ params, url, headers, send, cacheControl }) => {
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

  // For now: single shard only
  const page = clampInt(params.page, 1, 1)
  if (page !== 1) {
    send(404, 'Not found')
    return
  }

  const origin = baseUrl.origin

  const urls = HOTELS.map((h) => ({
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

const clampInt = (raw: string | undefined, min: number, max: number) => {
  const n = Number.parseInt(String(raw || ''), 10)
  if (!Number.isFinite(n)) return min
  if (n < min) return min
  if (n > max) return max
  return n
}

const escapeXml = (s: string) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
