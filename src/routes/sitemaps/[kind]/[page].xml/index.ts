import type { RequestHandler } from '@builder.io/qwik-city'
import { getPublicBaseUrl, shouldIndex } from '~/lib/seo/env'
import { buildUrlSetXml } from '~/lib/seo/sitemap'

export const onGet: RequestHandler = ({ params, url, headers, send }) => {
  headers.set('content-type', 'application/xml; charset=utf-8')

  const baseUrl = getPublicBaseUrl(url)
  if (!shouldIndex(baseUrl)) {
    send(200, buildUrlSetXml([]))
    return
  }

  const kind = String(params.kind || '').toLowerCase()
  const page = clampInt(params.page, 1, 50_000)

  const now = new Date().toISOString()

  // Replace these with real discovery (DB/CMS/search index)
  // For now, we keep it deterministic and safe.
  const urls =
    kind === 'pages'
      ? getStaticPages(baseUrl, now, page)
      : []

  send(200, buildUrlSetXml(urls))
}

const getStaticPages = (baseUrl: URL, now: string, page: number) => {
  // Page 1 only for static pages, keep the rest empty
  if (page !== 1) return []

  const paths = ['/', '/hotels', '/flights', '/car-rentals', '/explore', '/destinations', '/trips']

  return paths.map((p) => ({
    loc: new URL(p, baseUrl).href,
    lastmod: now,
    changefreq: 'daily',
    priority: p === '/' ? '1.0' : '0.7',
  }))
}

const clampInt = (raw: string | undefined, min: number, max: number) => {
  const n = Number.parseInt(String(raw || ''), 10)
  if (!Number.isFinite(n)) return min
  if (n < min) return min
  if (n > max) return max
  return n
}
