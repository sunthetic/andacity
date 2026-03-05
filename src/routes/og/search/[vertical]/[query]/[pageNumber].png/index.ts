import type { RequestHandler } from '@builder.io/qwik-city'
import { Resvg } from '@resvg/resvg-js'
import { getPublicBaseUrl, shouldIndex } from '~/lib/seo/env'
import { decodeOgPayload, getOgSecret, verifyOgSignature } from '~/lib/seo/og-sign'

export const onGet: RequestHandler = async ({ params, url, headers, send, cacheControl }) => {
  const vertical = normalizeVertical(params.vertical)
  if (!vertical) {
    send(404, 'Not found')
    return
  }

  const query = normalizeQuery(params.query)
  const page = clampInt(params.pageNumber, 1, 9999)

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

  headers.set('content-type', 'image/png')

  const qHuman = safeTitleQuery(query)
  const verticalLabel = vertical === 'autos' ? 'Cars' : capitalize(vertical)

  let title = `${verticalLabel} search`
  let subtitle = qHuman.length > 56 ? qHuman.slice(0, 56).trim() + '…' : qHuman
  let stats: OgStats | null = null

  const p = url.searchParams.get('p')
  const sig = url.searchParams.get('sig')
  const secret = getOgSecret()

  if (p && sig && secret && (await verifyOgSignature(p, sig, secret))) {
    const decoded = decodeOgPayload<OgSearchPayload>(p)
    if (decoded && decoded.v === vertical && decoded.q === query && decoded.page === page) {
      if (decoded.title) title = decoded.title
      if (decoded.subtitle) subtitle = decoded.subtitle
      stats = decoded.stats || null
    }
  }

  const width = 1200
  const height = 630

  const svg = buildSearchOgSvg({
    width,
    height,
    title,
    subtitle,
    verticalLabel,
    page,
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

const renderPng = (svg: string, width: number) => {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
  })

  return resvg.render().asPng()
}

const buildSearchOgSvg = (d: OgData) => {
  const {
    width,
    height,
    title,
    subtitle,
    verticalLabel,
    page,
    stats,
    primary,
    neutral900,
    neutral600,
    surface,
    panel,
    border,
  } = d

  const font = 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'

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

  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#bg)"/>
  <rect x="0" y="0" width="${width}" height="10" fill="url(#accent)"/>

  <g filter="url(#shadow)">
    <rect x="70" y="88" rx="28" ry="28" width="${width - 140}" height="${height - 176}" fill="${surface}" stroke="${border}" stroke-width="2"/>
  </g>

  <g>
    <rect x="108" y="130" rx="999" ry="999" width="168" height="44" fill="${panel}" stroke="${border}" stroke-width="2"/>
    <circle cx="130" cy="152" r="8" fill="${primary}"/>
    <text x="146" y="158" font-family="${font}" font-size="18" fill="${neutral900}" font-weight="600">Andacity</text>

    <rect x="292" y="130" rx="999" ry="999" width="150" height="44" fill="${panel}" stroke="${border}" stroke-width="2"/>
    <text x="367" y="158" text-anchor="middle" font-family="${font}" font-size="18" fill="${neutral900}" font-weight="600">${escapeXml(verticalLabel)}</text>

    <rect x="${width - 108 - 130}" y="130" rx="999" ry="999" width="130" height="44" fill="${panel}" stroke="${border}" stroke-width="2"/>
    <text x="${width - 108 - 65}" y="158" text-anchor="middle" font-family="${font}" font-size="18" fill="${neutral900}" font-weight="600">Page ${page}</text>
  </g>

  <text x="108" y="260" font-family="${font}" font-size="44" fill="${neutral900}" font-weight="700">
    ${escapeXml(title)}
  </text>

  <text x="108" y="318" font-family="${font}" font-size="30" fill="${neutral600}" font-weight="500">
    ${escapeXml(subtitle)}
  </text>

  <rect x="108" y="360" width="${width - 216}" height="2" fill="${border}"/>

  <g opacity="0.96">
    ${stats
      ? statsRows(108, 404, width - 216, panel, border, neutral900, neutral600, font, stats)
      : [
        dataBar(108, 408, width - 216, 22, panel, border),
        dataBar(108, 452, width - 310, 22, panel, border),
        dataBar(108, 496, width - 250, 22, panel, border),
        dataBar(108, 540, width - 420, 22, panel, border),
      ].join('\n')
    }
  </g>

  <g opacity="0.9">
    <rect x="${width - 170}" y="${height - 170}" width="90" height="90" rx="22" fill="${primary}" fill-opacity="0.12" stroke="${primary}" stroke-opacity="0.25" stroke-width="2"/>
    <path d="M ${width - 145} ${height - 125} L ${width - 110} ${height - 145} L ${width - 95} ${height - 120}" fill="none" stroke="${primary}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
  </g>
</svg>
`.trim()
}

const dataBar = (x: number, y: number, w: number, h: number, fill: string, stroke: string) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`

const statsRows = (
  x: number,
  y: number,
  w: number,
  fill: string,
  stroke: string,
  neutral900: string,
  neutral600: string,
  font: string,
  stats: OgStats
) => {
  const rows: { label: string; value: string }[] = []

  if (typeof stats.count === 'number') rows.push({ label: 'Results', value: stats.count.toLocaleString('en-US') })
  if (stats.priceMin != null || stats.priceMax != null) {
    const min = stats.priceMin != null ? money(stats.priceMin, stats.currency || 'USD') : '—'
    const max = stats.priceMax != null ? money(stats.priceMax, stats.currency || 'USD') : '—'
    rows.push({ label: 'Price range', value: `${min} – ${max}` })
  }
  if (stats.topArea) rows.push({ label: 'Top area', value: stats.topArea })
  if (stats.note) rows.push({ label: 'Note', value: stats.note })

  while (rows.length < 3) rows.push({ label: ' ', value: ' ' })
  const clipped = rows.slice(0, 4)

  return clipped
    .map((r, i) => statRow(x, y + i * 44, w, 30, fill, stroke, neutral900, neutral600, font, r.label, r.value))
    .join('\n')
}

const statRow = (
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  stroke: string,
  neutral900: string,
  neutral600: string,
  font: string,
  label: string,
  value: string
) => `
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
<text x="${x + 18}" y="${y + 21}" font-family="${font}" font-size="16" fill="${neutral600}" font-weight="600">${escapeXml(label)}</text>
<text x="${x + w - 18}" y="${y + 21}" text-anchor="end" font-family="${font}" font-size="16" fill="${neutral900}" font-weight="700">${escapeXml(value)}</text>
`.trim()

const money = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `${Math.round(amount)} ${currency}`
  }
}

const normalizeVertical = (raw: string | undefined): SearchVertical | null => {
  const v = String(raw || '').toLowerCase()
  if (v === 'hotels' || v === 'flights' || v === 'autos') return v
  return null
}

const normalizeQuery = (raw: string | undefined) => {
  const q = String(raw || '').trim()
  return q.length ? q : 'anywhere'
}

const clampInt = (raw: string | undefined, min: number, max: number) => {
  const n = Number.parseInt(String(raw || ''), 10)
  if (!Number.isFinite(n)) return min
  if (n < min) return min
  if (n > max) return max
  return n
}

const safeTitleQuery = (q: string) => {
  try {
    const decoded = decodeURIComponent(q)
    return decoded.replaceAll(/\s+/g, ' ').trim()
  } catch {
    return q
  }
}

const escapeXml = (s: string) =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')

const capitalize = (s: string) => s.slice(0, 1).toUpperCase() + s.slice(1)

/* -----------------------------
   Types
----------------------------- */

type SearchVertical = 'hotels' | 'flights' | 'autos'

type OgStats = {
  count?: number
  priceMin?: number
  priceMax?: number
  currency?: string
  topArea?: string
  note?: string
}

type OgSearchPayload = {
  v: SearchVertical
  q: string
  page: number
  title?: string
  subtitle?: string
  stats?: OgStats
}

type OgData = {
  width: number
  height: number
  title: string
  subtitle: string
  verticalLabel: string
  page: number
  stats: OgStats | null
  primary: string
  neutral900: string
  neutral600: string
  surface: string
  panel: string
  border: string
}
