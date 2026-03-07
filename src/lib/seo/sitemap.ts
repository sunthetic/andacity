export const escapeXml = (s: string) =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')

export const buildSitemapIndexXml = (sitemaps: { loc: string; lastmod?: string }[]) => {
  const entries = sitemaps
    .map((sm) => {
      const lastmod = sm.lastmod ? `<lastmod>${escapeXml(sm.lastmod)}</lastmod>` : ''
      return `<sitemap><loc>${escapeXml(sm.loc)}</loc>${lastmod}</sitemap>`
    })
    .join('')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries,
    '</sitemapindex>',
  ].join('')
}

export const buildUrlSetXml = (urls: { loc: string; lastmod?: string; changefreq?: string; priority?: string }[]) => {
  const entries = urls
    .map((u) => {
      const lastmod = u.lastmod ? `<lastmod>${escapeXml(u.lastmod)}</lastmod>` : ''
      const changefreq = u.changefreq ? `<changefreq>${escapeXml(u.changefreq)}</changefreq>` : ''
      const priority = u.priority ? `<priority>${escapeXml(u.priority)}</priority>` : ''
      return `<url><loc>${escapeXml(u.loc)}</loc>${lastmod}${changefreq}${priority}</url>`
    })
    .join('')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries,
    '</urlset>',
  ].join('')
}
