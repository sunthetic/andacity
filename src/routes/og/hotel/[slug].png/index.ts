import type { RequestHandler } from '@builder.io/qwik-city'
import { Resvg } from '@resvg/resvg-js'
import { loadHotelBySlugFromDb } from '~/lib/queries/hotels-pages.server'
import { getPublicBaseUrl, shouldIndex } from '~/lib/seo/env'
import { decodeOgPayload, getOgSecret, verifyOgSignature } from '~/lib/seo/og-sign'

export const onGet: RequestHandler = async ({ params, url, headers, send, cacheControl }) => {
  const slug = String(params.slug || '').trim().toLowerCase()
  if (!slug) {
    send(404, 'Not found')
    return
  }

  const baseUrl = getPublicBaseUrl(url)
  const prod = shouldIndex(baseUrl)

  // Caching:
  // - In prod, allow CDN caching with revalidation
  // - In non-prod, disable caching to avoid confusion
  if (prod) {
    cacheControl({
      public: true,
      maxAge: 60 * 10, // 10 minutes browser
      sMaxAge: 60 * 60 * 24, // 24 hours CDN
      staleWhileRevalidate: 60 * 60 * 24 * 7, // 7 days
    })
  } else {
    headers.set('cache-control', 'no-store')
  }

  headers.set('content-type', 'image/png')

  // Optional signed payload: ?p=...&sig=...
  const secret = getOgSecret()
  const p = url.searchParams.get('p')
  const sig = url.searchParams.get('sig')

  const payload = readPayload({ slug, p, sig, secret })
  const fromData = await loadHotelBySlugFromDb(slug)

  const hotelName = payload?.name || fromData?.name || titleFromSlug(slug)
  const city = payload?.city || fromData?.city || 'Andacity Travel'
  const neighborhood = payload?.neighborhood || fromData?.neighborhood || 'Central'
  const rating = payload?.rating ?? fromData?.rating ?? 4.6
  const reviewCount = payload?.reviewCount ?? fromData?.reviewCount ?? 2841
  const fromNightly = payload?.fromNightly ?? fromData?.fromNightly ?? 219
  const currency = payload?.currency || fromData?.currency || 'USD'
  const refundable = payload?.refundable ?? fromData?.policies.freeCancellation ?? true
  const payLater = payload?.payLater ?? fromData?.policies.payLater ?? true

  const width = 1200
  const height = 630

  const title = hotelName
  const subtitle = `${neighborhood} · ${city}`

  const stats: OgHotelStats = {
    fromNightly,
    currency,
    rating,
    reviewCount,
    refundable,
    payLater,
  }

  const svg = buildHotelOgSvg({
    width,
    height,
    title,
    subtitle,
    stats,
    primary: '#2563EB',
    neutral900: '#0B1220',
    neutral600: '#64748B',
    surface: '#FFFFFF',
    panel: '#F3F4F6',
    border: 'rgba(176, 182, 194, 0.70)',
  })

  const png = renderPng(svg, width)
  send(200, png)
}

const readPayload = (d: { slug: string; p: string | null; sig: string | null; secret: string | null }) => {
  if (!d.p || !d.sig || !d.secret) return null
  if (!verifyOgSignature(d.p, d.sig, d.secret)) return null

  const decoded = decodeOgPayload<OgHotelPayload>(d.p)
  if (!decoded) return null

  // Basic sanity checks to avoid mismatches
  if (String(decoded.slug || '').trim().toLowerCase() !== d.slug) return null
  return decoded
}

const renderPng = (svg: string, width: number) => {
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: width,
    },
  })

  const rendered = resvg.render()
  return rendered.asPng()
}

const buildHotelOgSvg = (d: OgHotelSvgData) => {
  const { width, height, title, subtitle, stats, primary, neutral900, neutral600, surface, panel, border } = d

  // System font stack: avoids bundling fonts
  const font = `ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`

  const badge = (x: number, y: number, w: number, label: string) => `
<rect x="${x}" y="${y}" rx="999" ry="999" width="${w}" height="44" fill="${panel}" stroke="${border}" stroke-width="2"/>
<text x="${x + w / 2}" y="${y + 28}" text-anchor="middle" font-family="${font}" font-size="18" fill="${neutral900}" font-weight="700">${escapeXml(label)}</text>
`.trim()

  const starText = `${stats.rating.toFixed(1)} ★`
  const reviewText = `${stats.reviewCount.toLocaleString('en-US')} reviews`
  const priceText = `${money(stats.fromNightly, stats.currency)}/night`
  const policyBits = [
    stats.refundable ? 'Free cancellation' : 'Cancellation varies',
    stats.payLater ? 'Pay later' : 'Prepay options',
  ].join(' · ')

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
	<defs>
		<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0%" stop-color="${surface}"/>
			<stop offset="55%" stop-color="${surface}"/>
			<stop offset="100%" stop-color="${panel}"/>
		</linearGradient>

		<linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
			<stop offset="0%" stop-color="${primary}" stop-opacity="0.95"/>
			<stop offset="100%" stop-color="${primary}" stop-opacity="0.25"/>
		</linearGradient>

		<filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
			<feDropShadow dx="0" dy="10" stdDeviation="18" flood-color="#000000" flood-opacity="0.12"/>
		</filter>
	</defs>

	<!-- Background -->
	<rect x="0" y="0" width="${width}" height="${height}" fill="url(#bg)"/>
	<rect x="0" y="0" width="${width}" height="10" fill="url(#accent)"/>

	<!-- Main card -->
	<g filter="url(#shadow)">
		<rect x="70" y="88" rx="28" ry="28" width="${width - 140}" height="${height - 176}" fill="${surface}" stroke="${border}" stroke-width="2"/>
	</g>

	<!-- Header row: brand + rating + price -->
	<g>
		<!-- Brand pill -->
		<rect x="108" y="130" rx="999" ry="999" width="168" height="44" fill="${panel}" stroke="${border}" stroke-width="2"/>
		<circle cx="130" cy="152" r="8" fill="${primary}"/>
		<text x="146" y="158" font-family="${font}" font-size="18" fill="${neutral900}" font-weight="700">Andacity</text>

		${badge(292, 130, 150, starText)}
		${badge(width - 108 - 220, 130, 220, priceText)}
	</g>

	<!-- Title -->
	<text x="108" y="260" font-family="${font}" font-size="44" fill="${neutral900}" font-weight="800">
		${escapeXml(clip(title, 42))}
	</text>

	<!-- Subtitle -->
	<text x="108" y="318" font-family="${font}" font-size="30" fill="${neutral600}" font-weight="600">
		${escapeXml(clip(subtitle, 56))}
	</text>

	<!-- Divider -->
	<rect x="108" y="360" width="${width - 216}" height="2" fill="${border}"/>

	<!-- Bottom rows -->
	<g opacity="0.96">
		${statRow(108, 404, width - 216, panel, border, neutral900, neutral600, font, 'Reviews', reviewText)}
		${statRow(108, 448, width - 216, panel, border, neutral900, neutral600, font, 'Policies', policyBits)}
		${statRow(108, 492, width - 216, panel, border, neutral900, neutral600, font, 'Est. from', priceText)}
	</g>

	<!-- Accent corner mark -->
	<g opacity="0.9">
		<rect x="${width - 170}" y="${height - 170}" width="90" height="90" rx="22" fill="${primary}" fill-opacity="0.12" stroke="${primary}" stroke-opacity="0.25" stroke-width="2"/>
		<path d="M ${width - 145} ${height - 125} L ${width - 110} ${height - 145} L ${width - 95} ${height - 120}" fill="none" stroke="${primary}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
	</g>
</svg>
`.trim()
}

const statRow = (
  x: number,
  y: number,
  w: number,
  fill: string,
  stroke: string,
  neutral900: string,
  neutral600: string,
  font: string,
  label: string,
  value: string
) => `
<rect x="${x}" y="${y}" width="${w}" height="30" rx="15" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
<text x="${x + 18}" y="${y + 21}" font-family="${font}" font-size="16" fill="${neutral600}" font-weight="700">${escapeXml(label)}</text>
<text x="${x + w - 18}" y="${y + 21}" text-anchor="end" font-family="${font}" font-size="16" fill="${neutral900}" font-weight="800">${escapeXml(value)}</text>
`.trim()

const money = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `${Math.round(amount)} ${currency}`
  }
}

const clip = (s: string, max: number) => (s.length > max ? s.slice(0, max - 1).trim() + '…' : s)

const escapeXml = (s: string) =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')

const titleFromSlug = (slug: string) => {
  const words = slug
    .split('-')
    .map((w) => w.trim())
    .filter(Boolean)
    .slice(0, 6)
  return words.map((w) => w.slice(0, 1).toUpperCase() + w.slice(1)).join(' ')
}

/* -----------------------------
   Types
----------------------------- */

type OgHotelStats = {
  fromNightly: number
  currency: string
  rating: number
  reviewCount: number
  refundable: boolean
  payLater: boolean
}

type OgHotelSvgData = {
  width: number
  height: number
  title: string
  subtitle: string
  stats: OgHotelStats
  primary: string
  neutral900: string
  neutral600: string
  surface: string
  panel: string
  border: string
}

type OgHotelPayload = {
  slug: string
  name?: string
  city?: string
  neighborhood?: string
  fromNightly?: number
  currency?: string
  rating?: number
  reviewCount?: number
  refundable?: boolean
  payLater?: boolean
}
