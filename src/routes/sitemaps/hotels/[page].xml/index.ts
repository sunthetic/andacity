import type { RequestHandler } from '@builder.io/qwik-city'
import { HOTELS } from '~/data/hotels'
import { tryDbRead } from '~/lib/db/read-switch.server'
import { loadHotelSitemapPageFromDb } from '~/lib/queries/hotels-pages.server'
import { getPublicBaseUrl, shouldIndex } from '~/lib/seo/env'

export const onGet: RequestHandler = async ({ params, url, headers, send, cacheControl }) => {
  const baseUrl = getPublicBaseUrl(url)
  const prod = shouldIndex(baseUrl)
  const pageSize = 1000

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
  if (page == null) {
    send(404, 'Not found')
    return
  }

  const source = await tryDbRead(
    () =>
      loadHotelSitemapPageFromDb({
        page,
        pageSize,
      }),
    () => {
      const totalCount = HOTELS.length
      const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
      const start = (Math.min(page, totalPages) - 1) * pageSize
      const slugs = HOTELS.slice(start, start + pageSize).map((hotel) => hotel.slug)

      return {
        totalCount,
        totalPages,
        slugs,
      }
    },
  )
  if (page > source.totalPages) {
    send(404, 'Not found')
    return
  }

  const origin = baseUrl.origin
  const urls = source.slugs.map((slug) => ({
    loc: `${origin}/hotels/${encodeURIComponent(slug)}`,
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
