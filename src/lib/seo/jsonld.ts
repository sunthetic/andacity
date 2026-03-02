export const buildWebSiteJsonLd = (baseUrl: URL) => {
  const origin = baseUrl.origin

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Andacity Travel',
    url: origin,
    potentialAction: [
      {
        '@type': 'SearchAction',
        target: `${origin}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    ],
  }
}
