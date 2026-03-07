import { component$ } from '@builder.io/qwik'
import { useDocumentHead, useLocation } from '@builder.io/qwik-city'
import { getCanonicalHref, getPublicBaseUrl, shouldIndex } from '~/lib/seo/env'

export const RouterHead = component$(() => {
  const head = useDocumentHead()
  const loc = useLocation()

  const baseUrl = getPublicBaseUrl(loc.url)
  const allowIndexingByEnv = shouldIndex(baseUrl)

  const routeTitle = head.title?.trim()
  const title = routeTitle || 'Andacity Travel'

  const routeDescription = findMeta(head.meta, 'name', 'description')?.content?.trim()
  const description =
    routeDescription || 'Book hotels, flights, and cars with clean comparison and transparent totals.'

  // Canonical: prefer route-provided canonical link if present, otherwise build from path (NO query by default).
  // We intentionally do NOT canonicalize loc.url.search globally because it creates infinite permutations.
  const routeCanonical = findCanonical(head.links)?.href
  const canonicalHref =
    routeCanonical ||
    getCanonicalHref(baseUrl, { pathname: loc.url.pathname, searchParams: loc.url.searchParams })

  // Robots: route-level wins (eg /search => noindex,follow; hotel params => noindex,follow)
  // If no route robots set, fall back to env indexing policy.
  const routeRobots = findMeta(head.meta, 'name', 'robots')?.content?.trim() || null
  const robots = routeRobots
    ? routeRobots
    : allowIndexingByEnv
      ? 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
      : 'noindex,nofollow,noarchive,nosnippet'

  // OG/Twitter: prefer route-provided, else defaults
  const ogType = findMeta(head.meta, 'property', 'og:type')?.content || 'website'
  const ogImage =
    findMeta(head.meta, 'property', 'og:image')?.content ||
    new URL('/og/default.png', baseUrl).href

  const twitterCard =
    findMeta(head.meta, 'name', 'twitter:card')?.content || 'summary_large_image'

  // JSON-LD via meta channel
  const jsonLd = extractJsonLd(head.meta)

  // Filter out route-provided meta we already render explicitly to avoid duplicates
  const metaRemainder = head.meta.filter((m) => {
    const anyM = m as any
    const name = anyM.name as string | undefined
    const prop = anyM.property as string | undefined

    if (name === 'description') return false
    if (name === 'robots') return false
    if (name === 'twitter:card') return false
    if (name === 'twitter:title') return false
    if (name === 'twitter:description') return false
    if (name === 'twitter:image') return false
    if (name === 'json-ld') return false

    if (prop === 'og:type') return false
    if (prop === 'og:title') return false
    if (prop === 'og:description') return false
    if (prop === 'og:url') return false
    if (prop === 'og:image') return false

    return true
  })

  // Filter out route canonical links if we’re rendering canonical ourselves
  const linkRemainder = head.links.filter((l) => {
    const rel = (l as any).rel as string | undefined
    if (rel === 'canonical') return false
    return true
  })

  return (
    <>
      <title>{title}</title>

      <link rel="canonical" href={canonicalHref} />
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalHref} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* PWA + icons */}
      <link rel="manifest" href="/manifest.json" />
      <link rel="icon" href="/favicon.ico" />
      {/* <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" /> */}
      {/* <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16.png" /> */}
      <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />

      <meta name="theme-color" content="#2563EB" />

      {/* Route-provided metas (minus duplicates) */}
      {metaRemainder.map((m) => (
        <meta key={(m as any).key || (m as any).name || (m as any).property} {...(m as any)} />
      ))}

      {/* Route-provided link tags (minus canonical) */}
      {linkRemainder.map((l) => (
        <link key={(l as any).key || (l as any).href} {...(l as any)} />
      ))}

      {/* Route-provided inline styles */}
      {head.styles.map((s) => (
        <style key={(s as any).key} {...(s as any).props} dangerouslySetInnerHTML={(s as any).style} />
      ))}

      {/* Global WebSite JSON-LD only if the env allows indexing AND the route itself is indexable */}
      {isIndexableRobots(robots) ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={JSON.stringify(buildWebSiteJsonLd(baseUrl))}
        />
      ) : null}

      {/* JSON-LD (route-provided) */}
      {jsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd} />
      ) : null}
    </>
  )
})

const findMeta = (meta: readonly MetaLike[], key: 'name' | 'property', value: string) => {
  return meta.find((m) => (m as any)[key] === value) as MetaTagLike | undefined
}

const findCanonical = (links: readonly LinkLike[]) => {
  return links.find((l) => (l as any).rel === 'canonical') as LinkLike | undefined
}

const extractJsonLd = (meta: readonly MetaLike[]) => {
  const m = meta.find((x) => (x as any).name === 'json-ld') as MetaTagLike | undefined
  return m?.content || null
}

const isIndexableRobots = (robots: string) => {
  const r = robots.toLowerCase()
  if (r.includes('noindex')) return false
  return true
}

const buildWebSiteJsonLd = (baseUrl: URL) => {
  const origin = baseUrl.origin

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Andacity Travel',
    url: origin,
    potentialAction: [
      {
        '@type': 'SearchAction',
        target: `${origin}/search/hotels/{search_term_string}/1`,
        'query-input': 'required name=search_term_string',
      },
    ],
  }
}

/* -----------------------------
   Types
----------------------------- */

type MetaTagLike = {
  key?: string
  name?: string
  property?: string
  content?: string
}

type MetaLike = MetaTagLike

type LinkLike = {
  key?: string
  rel?: string
  href?: string
}
