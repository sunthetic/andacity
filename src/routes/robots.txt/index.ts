import type { RequestHandler } from '@builder.io/qwik-city'

export const onGet: RequestHandler = async ({ cacheControl, send, url }) => {
  cacheControl({
    public: true,
    maxAge: 60 * 60, // 1h
    sMaxAge: 60 * 60, // 1h
  })

  const origin = url.origin
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    // Keep search noindex at the page-level; we still disallow crawling to reduce noise.
    'Disallow: /search/',
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n')

  send(200, body)
}