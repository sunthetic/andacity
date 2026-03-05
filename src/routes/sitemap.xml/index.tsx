import type { RequestHandler } from '@builder.io/qwik-city'

export const onGet: RequestHandler = async ({ headers, send }) => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<!-- your urls -->
</urlset>`

  headers.set('Content-Type', 'application/xml; charset=utf-8')
  headers.set('Cache-Control', 'public, max-age=600')

  send(200, xml)
}
