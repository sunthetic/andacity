import type { RequestHandler } from '@builder.io/qwik-city'
import { DESTINATIONS } from '~/data/destinations'
import { HOTEL_CITIES } from '~/data/hotel-cities'
import { CAR_RENTAL_CITIES } from '~/data/car-rental-cities'
import { getPublicBaseUrl, shouldIndex } from '~/lib/seo/env'

export const onGet: RequestHandler = ({ url, headers, send, cacheControl }) => {
  const baseUrl = getPublicBaseUrl(url)
  const prod = shouldIndex(baseUrl)

  headers.set('Content-Type', 'application/xml; charset=utf-8')

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
  const now = new Date().toISOString()

  const staticRoutes: SitemapEntry[] = [
    { loc: `${origin}/`, priority: 1.0, changefreq: 'daily' },
    { loc: `${origin}/hotels`, priority: 0.9, changefreq: 'daily' },
    { loc: `${origin}/flights`, priority: 0.9, changefreq: 'daily' },
    { loc: `${origin}/car-rentals`, priority: 0.9, changefreq: 'daily' },
    { loc: `${origin}/explore`, priority: 0.8, changefreq: 'weekly' },
    { loc: `${origin}/destinations`, priority: 0.8, changefreq: 'weekly' },
    { loc: `${origin}/hotels/in`, priority: 0.7, changefreq: 'weekly' },
    { loc: `${origin}/car-rentals/in`, priority: 0.7, changefreq: 'weekly' },
    { loc: `${origin}/privacy`, priority: 0.3, changefreq: 'monthly' },
    { loc: `${origin}/terms`, priority: 0.3, changefreq: 'monthly' },
    { loc: `${origin}/contact`, priority: 0.4, changefreq: 'monthly' },
  ]

  const destinationRoutes: SitemapEntry[] = DESTINATIONS.map((d) => ({
    loc: `${origin}/destinations/${encodeURIComponent(d.slug)}`,
    priority: 0.7,
    changefreq: 'weekly' as const,
  }))

  const hotelCityRoutes: SitemapEntry[] = HOTEL_CITIES.map((c) => ({
    loc: `${origin}/hotels/in/${encodeURIComponent(c.slug)}`,
    priority: 0.7,
    changefreq: 'daily' as const,
  }))

  const carRentalCityRoutes: SitemapEntry[] = CAR_RENTAL_CITIES.map((c) => ({
    loc: `${origin}/car-rentals/in/${encodeURIComponent(c.slug)}`,
    priority: 0.6,
    changefreq: 'weekly' as const,
  }))

  const allEntries = [
    ...staticRoutes,
    ...destinationRoutes,
    ...hotelCityRoutes,
    ...carRentalCityRoutes,
  ]

  send(200, urlsetXml(allEntries, now))
}

type SitemapEntry = {
  loc: string
  priority?: number
  changefreq?: string
  lastmod?: string
}

const urlsetXml = (items: SitemapEntry[], fallbackDate: string) => {
  const lines = items.map((x) => `  <url>
    <loc>${escapeXml(x.loc)}</loc>
    <lastmod>${escapeXml(x.lastmod || fallbackDate)}</lastmod>
    ${x.changefreq ? `<changefreq>${escapeXml(x.changefreq)}</changefreq>` : ''}
    ${typeof x.priority === 'number' ? `<priority>${x.priority.toFixed(1)}</priority>` : ''}
  </url>`)

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${lines.join('\n')}
</urlset>
`
}

const escapeXml = (s: string) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
