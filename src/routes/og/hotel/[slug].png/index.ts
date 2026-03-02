import type { RequestHandler } from '@builder.io/qwik-city'
import { Resvg } from '@resvg/resvg-js'
import { HOTELS_BY_SLUG } from '~/data/hotels'
import { getPublicBaseUrl, shouldIndex } from '~/lib/seo/env'
import { decodeOgPayload, encodeOgPayload, getOgSecret, signOgPayload, verifyOgSignature } from '~/lib/seo/og-sign'

export const onGet: RequestHandler = ({ params, url, headers, send, cacheControl }) => {
  const slug = String(params.slug || '').toLowerCase().trim()
  const hotel = HOTELS_BY_SLUG[slug]
  if (!hotel) {
    send(404, 'Not found')
    return
  }

  const baseUrl = getPublicBaseUrl(url)
  const prod = shouldIndex(baseUrl)

  if (prod) {
    cacheControl({
      public: true,
      maxAge: 60 * 10,
      sMaxAge: 60 * 60 * 24,
      staleWhileRevalidate: 60 * 60 * 24 * 7,
    })
  } else {
    headers.set('cache-control', 'no-store')
  }

  const secret = getOgSecret()

  // Default payload derived from hotel record
  let payload = buildHotelOgPayloadFromHotel(slug, hotel)

  // Optional signed override (p + sig)
  const p = url.searchParams.get('p')
  const sig = url.searchParams.get('sig')

  if (secret && p && sig && verifyOgSignature(p, sig, secret)) {
    const decoded = decodeOgPayload<OgHotelPayload>(p)
    if (decoded && decoded.v === 1 && decoded.slug === slug) {
      payload = decoded
    }
  }

  const width = 1200
  const height = 630

  const svg = buildHotelOgSvg({
    width,
    height,
    brand: 'Andacity',
    title: payload.title,
    subtitle: payload.subtitle,
    locationLine: payload.locationLine,
    rating: payload.rating,
    reviews: payload.reviews,
    priceFrom: payload.priceFrom,
    currency: payload.currency,
    badges: payload.badges,

    primary: '#2563EB',
    neutral900: '#0B1220',
    neutral600: '#64748B',
    surface: '#FFFFFF',
    panel: '#F3F4F6',
    border: 'rgba(176, 182, 194, 0.70)',
  })

  const png = renderPng(svg, width)

  headers.set('content-type', 'image/png')
  send(200, png)
}

const renderPng = (svg: string, width: number) => {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
  })

  const rendered = resvg.render()
  return rendered.asPng()
}

/* -----------------------------
   Payload helpers
----------------------------- */

const buildHotelOgPayloadFromHotel = (
  slug: string,
  hotel: {
    name: string
    city: string
    rating: number
    reviewCount: number
    rooms: { priceNightlyFrom: number; currency: string }[]
  }
): OgHotelPayload => {
  const min = Math.min(...hotel.rooms.map((r) => r.priceNightlyFrom))
  const currency = hotel.rooms[0]?.currency || 'USD'

  return {
    v: 1,
    slug,
    title: hotel.name,
    subtitle: hotel.city,
    locationLine: hotel.city,
    rating: hotel.rating,
    reviews: hotel.reviewCount,
    priceFrom: min,
    currency,
    badges: ['Transparent totals', 'Policy clarity'],
  }
}

/* -----------------------------
   SVG builder
----------------------------- */

const buildHotelOgSvg = (d: OgHotelSvgData) => {
  const font = `ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`

  const title = clampText(d.title, 46)
  const subtitle = clampText(d.subtitle, 62)

  const price = d.priceFrom != null ? money(d.priceFrom, d.currency || 'USD') : null
  const reviews = typeof d.reviews === 'number' ? d.reviews.toLocaleString('en-US') : null
  const rating = typeof d.rating === 'number' ? d.rating.toFixed(1) : null

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${d.width}" height="${d.height}" viewBox="0 0 ${d.width} ${d.height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${d.surface}"/>
      <stop offset="55%" stop-color="${d.surface}"/>
      <stop offset="100%" stop-color="${d.panel}"/>
    </linearGradient>

    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${d.primary}" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="${d.primary}" stop-opacity="0.25"/>
    </linearGradient>

    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="18" flood-color="#000000" flood-opacity="0.12"/>
    </filter>
  </defs>

  <rect x="0" y="0" width="${d.width}" height="${d.height}" fill="url(#bg)"/>
  <rect x="0" y="0" width="${d.width}" height="10" fill="url(#accent)"/>

  <g filter="url(#shadow)">
    <rect x="70" y="88" rx="28" ry="28" width="${d.width - 140}" height="${d.height - 176}" fill="${d.surface}" stroke="${d.border}" stroke-width="2"/>
  </g>

  <!-- Header pills -->
  <g>
    <rect x="108" y="130" rx="999" ry="999" width="176" height="44" fill="${d.panel}" stroke="${d.border}" stroke-width="2"/>
    <circle cx="130" cy="152" r="8" fill="${d.primary}"/>
    <text x="146" y="158" font-family="${font}" font-size="18" fill="${d.neutral900}" font-weight="650">${escapeXml(d.brand)}</text>

    <rect x="${d.width - 108 - 210}" y="130" rx="999" ry="999" width="210" height="44" fill="${d.panel}" stroke="${d.border}" stroke-width="2"/>
    <text x="${d.width - 108 - 105}" y="158" text-anchor="middle" font-family="${font}" font-size="18" fill="${d.neutral900}" font-weight="750">
      ${price ? `From ${escapeXml(price)}/night` : 'Compare rooms'}
    </text>
  </g>

  <text x="108" y="260" font-family="${font}" font-size="44" fill="${d.neutral900}" font-weight="760">
    ${escapeXml(title)}
  </text>

  <text x="108" y="318" font-family="${font}" font-size="30" fill="${d.neutral600}" font-weight="520">
    ${escapeXml(subtitle)}
  </text>

  <!-- Metrics -->
  <g>
    ${metricPill(108, 360, 220, d.panel, d.border, font, d.neutral900, d.neutral600, rating ? `${rating} ★` : '—', reviews ? `${reviews} reviews` : 'Reviews')}
    ${metricPill(340, 360, 240, d.panel, d.border, font, d.neutral900, d.neutral600, escapeXml(d.locationLine || ''), 'Location')}
  </g>

  <rect x="108" y="416" width="${d.width - 216}" height="2" fill="${d.border}"/>

  <g opacity="0.96">
    ${badgeRow(108, 452, d.width - 216, d.panel, d.border, font, d.neutral900, d.badges || [])}
  </g>

  <g opacity="0.9">
    <rect x="${d.width - 170}" y="${d.height - 170}" width="90" height="90" rx="22" fill="${d.primary}" fill-opacity="0.12" stroke="${d.primary}" stroke-opacity="0.25" stroke-width="2"/>
    <path d="M ${d.width - 145} ${d.height - 125} L ${d.width - 110} ${d.height - 145} L ${d.width - 95} ${d.height - 120}" fill="none" stroke="${d.primary}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
  </g>
</svg>
`.trim()
}

const metricPill = (
  x: number,
  y: number,
  w: number,
  fill: string,
  stroke: string,
  font: string,
  neutral900: string,
  neutral600: string,
  value: string,
  label: string
) => `
<rect x="${x}" y="${y}" width="${w}" height="44" rx="999" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
<text x="${x + 18}" y="${y + 28}" font-family="${font}" font-size="16" fill="${neutral600}" font-weight="650">${escapeXml(label)}</text>
<text x="${x + w - 18}" y="${y + 28}" text-anchor="end" font-family="${font}" font-size="16" fill="${neutral900}" font-weight="750">${escapeXml(value)}</text>
`.trim()

const badgeRow = (
  x: number,
  y: number,
  w: number,
  fill: string,
  stroke: string,
  font: string,
  neutral900: string,
  badges: string[]
) => {
  const row = badges.slice(0, 3)
  if (!row.length) return dataBar(x, y, w, 26, fill, stroke)

  const gap = 10
  const pillW = Math.floor((w - gap * (row.length - 1)) / row.length)

  return row
    .map((b, i) =>
      badgePill(x + i * (pillW + gap), y, pillW, 34, fill, stroke, font, neutral900, b)
    )
    .join('\n')
}

const badgePill = (
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  stroke: string,
  font: string,
  neutral900: string,
  text: string
) => `
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
<text x="${x + w / 2}" y="${y + 23}" text-anchor="middle" font-family="${font}" font-size="16" fill="${neutral900}" font-weight="650">${escapeXml(clampText(text, 24))}</text>
`.trim()

const dataBar = (x: number, y: number, w: number, h: number, fill: string, stroke: string) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`

/* -----------------------------
   Utils
----------------------------- */

const clampText = (s: string, max: number) => {
  const t = String(s || '').trim()
  if (t.length <= max) return t
  return t.slice(0, max).trim() + '…'
}

const money = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `${Math.round(amount)} ${currency}`
  }
}

const escapeXml = (s: string) =>
  String(s || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')

/* -----------------------------
   Types
----------------------------- */

type OgHotelPayload = {
  v: 1
  slug: string
  title: string
  subtitle: string
  locationLine?: string
  rating?: number
  reviews?: number
  priceFrom?: number
  currency?: string
  badges?: string[]
}

type OgHotelSvgData = {
  width: number
  height: number
  brand: string
  title: string
  subtitle: string
  locationLine?: string
  rating?: number
  reviews?: number
  priceFrom?: number
  currency?: string
  badges?: string[]
  primary: string
  neutral900: string
  neutral600: string
  surface: string
  panel: string
  border: string
}