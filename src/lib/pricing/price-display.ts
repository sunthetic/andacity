export const DEFAULT_CURRENCY_CODE = 'USD'
export const HOTEL_ESTIMATED_TAX_RATE = 0.14

export type PriceQualifierUnit = 'night' | 'day' | 'traveler'
export type PriceVertical = 'hotel' | 'car' | 'flight'
export type PriceChangeStatus = 'increased' | 'decreased' | 'unchanged' | 'unavailable'

export type PriceChange = {
  label: string
  status: PriceChangeStatus
  previousAmount: number | null
  currentAmount: number | null
  deltaAmount: number | null
}

export type PriceDisplayContract = {
  currencyCode: string | null
  baseAmount: number | null
  baseLabel: string
  baseQualifier?: PriceQualifierUnit | null
  unitCount?: number | null
  unitCountLabel?: string | null
  baseTotalAmount?: number | null
  baseTotalLabel?: string | null
  estimatedFeesAmount?: number | null
  estimatedFeesLabel?: string | null
  totalAmount?: number | null
  totalLabel?: string | null
  supportText?: string | null
  delta?: PriceChange | null
}

export type StoredPriceDisplayMetadata = {
  version: 1
  vertical: PriceVertical
  baseAmountCents: number
  baseLabel: string
  baseQualifier: PriceQualifierUnit | null
  unitCount: number | null
  unitCountLabel: string | null
  baseTotalAmountCents: number | null
  baseTotalLabel: string | null
  estimatedFeesAmountCents: number | null
  estimatedFeesLabel: string | null
  totalAmountCents: number | null
  totalLabel: string | null
  supportText: string | null
}

const normalizeAmount = (value: number | null | undefined) => {
  if (value == null) return null
  const amount = Number(value)
  if (!Number.isFinite(amount)) return null
  return Math.max(0, Math.round(amount))
}

const normalizeCurrencyCode = (value: string | null | undefined) => {
  const token = String(value || '')
    .trim()
    .toUpperCase()
  return /^[A-Z]{3}$/.test(token) ? token : DEFAULT_CURRENCY_CODE
}

const toPositiveInt = (value: number | null | undefined) => {
  if (value == null) return null
  const next = Math.round(Number(value))
  if (!Number.isFinite(next) || next < 1) return null
  return next
}

const pluralize = (value: number, singular: string, plural = `${singular}s`) => {
  return `${value} ${value === 1 ? singular : plural}`
}

const toNullableLabel = (value: string | null | undefined) => {
  const text = String(value || '').trim()
  return text ? text : null
}

const toNonNegativeInt = (value: unknown) => {
  const next = Number.parseInt(String(value || ''), 10)
  if (!Number.isFinite(next) || next < 0) return null
  return next
}

export const toAmountCents = (amount: number | null | undefined) => {
  if (amount == null) return null
  const next = Number(amount)
  if (!Number.isFinite(next)) return null
  return Math.max(0, Math.round(next * 100))
}

export const toAmountFromCents = (cents: number | null | undefined) => {
  if (cents == null) return null
  const next = Number(cents)
  if (!Number.isFinite(next)) return null
  return Math.max(0, next / 100)
}

export const formatMoney = (
  amount: number | null | undefined,
  currency: string | null | undefined,
  options?: {
    minimumFractionDigits?: number
    maximumFractionDigits?: number
  },
) => {
  const normalizedAmount = Number(amount)
  if (!Number.isFinite(normalizedAmount)) {
    return `0 ${normalizeCurrencyCode(currency)}`
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: normalizeCurrencyCode(currency),
      minimumFractionDigits: options?.minimumFractionDigits ?? 0,
      maximumFractionDigits: options?.maximumFractionDigits ?? 0,
    }).format(Math.max(0, normalizedAmount))
  } catch {
    const fallback = Math.max(0, normalizedAmount)
    return `${Math.round(fallback)} ${normalizeCurrencyCode(currency)}`
  }
}

export const formatMoneyFromCents = (
  cents: number | null | undefined,
  currency: string | null | undefined,
  options?: {
    minimumFractionDigits?: number
    maximumFractionDigits?: number
  },
) => {
  return formatMoney(toAmountFromCents(cents), currency, {
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  })
}

export const formatPriceQualifier = (unit: PriceQualifierUnit | null | undefined) => {
  if (unit === 'night') return '/night'
  if (unit === 'day') return '/day'
  if (unit === 'traveler') return '/traveler'
  return ''
}

export const formatUnitCountLabel = (
  unit: PriceQualifierUnit | null | undefined,
  unitCount: number | null | undefined,
) => {
  const count = toPositiveInt(unitCount)
  if (!count) return null
  if (unit === 'night') return pluralize(count, 'night')
  if (unit === 'day') return pluralize(count, 'day')
  if (unit === 'traveler') return pluralize(count, 'traveler')
  return null
}

export const buildPriceChange = (input: {
  label: string
  previousAmount: number | null | undefined
  currentAmount: number | null | undefined
}): PriceChange => {
  const previousAmount = normalizeAmount(input.previousAmount)
  const currentAmount = normalizeAmount(input.currentAmount)

  if (previousAmount == null || currentAmount == null) {
    return {
      label: input.label,
      status: 'unavailable',
      previousAmount,
      currentAmount,
      deltaAmount: null,
    }
  }

  if (currentAmount > previousAmount) {
    return {
      label: input.label,
      status: 'increased',
      previousAmount,
      currentAmount,
      deltaAmount: currentAmount - previousAmount,
    }
  }

  if (currentAmount < previousAmount) {
    return {
      label: input.label,
      status: 'decreased',
      previousAmount,
      currentAmount,
      deltaAmount: currentAmount - previousAmount,
    }
  }

  return {
    label: input.label,
    status: 'unchanged',
    previousAmount,
    currentAmount,
    deltaAmount: 0,
  }
}

export const formatPriceChange = (
  change: PriceChange | null | undefined,
  currency: string | null | undefined,
  suffix = 'after refresh',
) => {
  if (!change) return null
  if (change.status === 'unavailable' || change.deltaAmount == null) {
    return `${change.label} refreshed`
  }
  if (change.status === 'unchanged') {
    return `${change.label} unchanged ${suffix}`.trim()
  }

  const deltaText = formatMoney(Math.abs(change.deltaAmount), currency)
  return `${change.label} ${change.status === 'increased' ? 'up' : 'down'} ${deltaText} ${suffix}`.trim()
}

export const describePriceChangeCollection = (changes: Array<PriceChange | null | undefined>) => {
  const relevant = changes.filter((change): change is PriceChange => Boolean(change))
  if (!relevant.length) return null

  const increased = relevant.filter((change) => change.status === 'increased').length
  const decreased = relevant.filter((change) => change.status === 'decreased').length
  const unchanged = relevant.filter((change) => change.status === 'unchanged').length

  if (!increased && !decreased) {
    if (unchanged) return 'Availability refreshed. Visible prices did not change.'
    return 'Availability refreshed. Price changes are unavailable right now.'
  }

  const parts: string[] = []
  if (increased) parts.push(`${pluralize(increased, 'price')} increased`)
  if (decreased) parts.push(`${pluralize(decreased, 'price')} decreased`)
  if (unchanged) parts.push(`${pluralize(unchanged, 'price')} unchanged`)
  return `Availability refreshed. ${parts.join(' and ')}.`
}

export const buildHotelPriceDisplay = (input: {
  currencyCode: string | null | undefined
  nightlyRate: number | null | undefined
  nights?: number | null
  rooms?: number | null
  previousNightlyRate?: number | null
  supportText?: string | null
}): PriceDisplayContract => {
  const nights = toPositiveInt(input.nights)
  const rooms = toPositiveInt(input.rooms) || 1
  const unitCount = nights ? nights * rooms : null
  const baseAmount = normalizeAmount(input.nightlyRate)
  const baseTotalAmount = baseAmount != null && unitCount ? baseAmount * unitCount : null
  const estimatedFeesAmount =
    baseTotalAmount == null ? null : Math.round(baseTotalAmount * HOTEL_ESTIMATED_TAX_RATE)
  const totalAmount =
    baseTotalAmount == null || estimatedFeesAmount == null
      ? null
      : baseTotalAmount + estimatedFeesAmount

  return {
    currencyCode: normalizeCurrencyCode(input.currencyCode),
    baseAmount,
    baseLabel: 'Base rate',
    baseQualifier: 'night',
    unitCount,
    unitCountLabel:
      nights == null
        ? null
        : rooms > 1
          ? `${pluralize(nights, 'night')} · ${pluralize(rooms, 'room')}`
          : pluralize(nights, 'night'),
    baseTotalAmount,
    baseTotalLabel: baseTotalAmount == null ? null : 'Base stay total',
    estimatedFeesAmount,
    estimatedFeesLabel: estimatedFeesAmount == null ? null : 'Estimated taxes & fees',
    totalAmount,
    totalLabel: totalAmount == null ? null : 'Estimated total',
    supportText:
      toNullableLabel(input.supportText) ||
      'Base room rate shown first. Taxes and fees are estimated from current policy data.',
    delta: buildPriceChange({
      label: 'Nightly rate',
      previousAmount: input.previousNightlyRate,
      currentAmount: baseAmount,
    }),
  }
}

export const buildCarPriceDisplay = (input: {
  currencyCode: string | null | undefined
  dailyRate: number | null | undefined
  days?: number | null
  previousDailyRate?: number | null
  supportText?: string | null
}): PriceDisplayContract => {
  const days = toPositiveInt(input.days)
  const baseAmount = normalizeAmount(input.dailyRate)
  const baseTotalAmount = baseAmount != null && days ? baseAmount * days : null

  return {
    currencyCode: normalizeCurrencyCode(input.currencyCode),
    baseAmount,
    baseLabel: 'Base rate',
    baseQualifier: 'day',
    unitCount: days,
    unitCountLabel: formatUnitCountLabel('day', days),
    baseTotalAmount,
    baseTotalLabel: baseTotalAmount == null ? null : 'Base rental total',
    estimatedFeesAmount: null,
    estimatedFeesLabel: null,
    totalAmount: null,
    totalLabel: null,
    supportText:
      toNullableLabel(input.supportText) ||
      'Taxes, counter surcharges, protection products, and extras are shown later.',
    delta: buildPriceChange({
      label: 'Daily rate',
      previousAmount: input.previousDailyRate,
      currentAmount: baseAmount,
    }),
  }
}

export const buildFlightPriceDisplay = (input: {
  currencyCode: string | null | undefined
  fare: number | null | undefined
  travelers?: number | null
  previousFare?: number | null
  supportText?: string | null
}): PriceDisplayContract => {
  const travelers = toPositiveInt(input.travelers) || 1
  const baseAmount = normalizeAmount(input.fare)
  const baseTotalAmount = baseAmount != null && travelers > 1 ? baseAmount * travelers : null

  return {
    currencyCode: normalizeCurrencyCode(input.currencyCode),
    baseAmount,
    baseLabel: 'Base fare',
    baseQualifier: 'traveler',
    unitCount: travelers > 1 ? travelers : null,
    unitCountLabel: travelers > 1 ? pluralize(travelers, 'traveler') : null,
    baseTotalAmount,
    baseTotalLabel: baseTotalAmount == null ? null : 'Base trip fare',
    estimatedFeesAmount: null,
    estimatedFeesLabel: null,
    totalAmount: null,
    totalLabel: null,
    supportText:
      toNullableLabel(input.supportText) ||
      'Bags, seats, and supplier fees can change the final amount.',
    delta: buildPriceChange({
      label: 'Base fare',
      previousAmount: input.previousFare,
      currentAmount: baseAmount,
    }),
  }
}

export const toStoredPriceDisplayMetadata = (
  vertical: PriceVertical,
  display: PriceDisplayContract,
): StoredPriceDisplayMetadata => {
  return {
    version: 1,
    vertical,
    baseAmountCents: toAmountCents(display.baseAmount) || 0,
    baseLabel: display.baseLabel,
    baseQualifier: display.baseQualifier || null,
    unitCount: toPositiveInt(display.unitCount) || null,
    unitCountLabel: toNullableLabel(display.unitCountLabel),
    baseTotalAmountCents: toAmountCents(display.baseTotalAmount),
    baseTotalLabel: toNullableLabel(display.baseTotalLabel),
    estimatedFeesAmountCents: toAmountCents(display.estimatedFeesAmount),
    estimatedFeesLabel: toNullableLabel(display.estimatedFeesLabel),
    totalAmountCents: toAmountCents(display.totalAmount),
    totalLabel: toNullableLabel(display.totalLabel),
    supportText: toNullableLabel(display.supportText),
  }
}

export const mergePriceDisplayMetadata = (
  metadata: Record<string, unknown> | null | undefined,
  vertical: PriceVertical,
  display: PriceDisplayContract,
) => {
  return {
    ...(metadata || {}),
    priceDisplay: toStoredPriceDisplayMetadata(vertical, display),
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export const readStoredPriceDisplayMetadata = (
  metadata: Record<string, unknown> | null | undefined,
): StoredPriceDisplayMetadata | null => {
  if (!isRecord(metadata)) return null
  const raw = metadata.priceDisplay
  if (!isRecord(raw)) return null

  const vertical =
    raw.vertical === 'hotel' || raw.vertical === 'car' || raw.vertical === 'flight'
      ? raw.vertical
      : null
  if (!vertical) return null

  const baseAmountCents = Number.parseInt(String(raw.baseAmountCents || ''), 10)
  if (!Number.isFinite(baseAmountCents) || baseAmountCents < 0) return null

  return {
    version: 1,
    vertical,
    baseAmountCents,
    baseLabel: String(raw.baseLabel || 'Base price').trim() || 'Base price',
    baseQualifier:
      raw.baseQualifier === 'night' || raw.baseQualifier === 'day' || raw.baseQualifier === 'traveler'
        ? raw.baseQualifier
        : null,
    unitCount: toPositiveInt(Number(raw.unitCount)) || null,
    unitCountLabel: toNullableLabel(raw.unitCountLabel as string | null | undefined),
    baseTotalAmountCents: toNonNegativeInt(raw.baseTotalAmountCents),
    baseTotalLabel: toNullableLabel(raw.baseTotalLabel as string | null | undefined),
    estimatedFeesAmountCents: toNonNegativeInt(raw.estimatedFeesAmountCents),
    estimatedFeesLabel: toNullableLabel(raw.estimatedFeesLabel as string | null | undefined),
    totalAmountCents: toNonNegativeInt(raw.totalAmountCents),
    totalLabel: toNullableLabel(raw.totalLabel as string | null | undefined),
    supportText: toNullableLabel(raw.supportText as string | null | undefined),
  }
}

export const buildPriceDisplayFromMetadata = (
  metadata: Record<string, unknown> | null | undefined,
  currencyCode: string | null | undefined,
): PriceDisplayContract | null => {
  const stored = readStoredPriceDisplayMetadata(metadata)
  if (!stored) return null

  return {
    currencyCode: normalizeCurrencyCode(currencyCode),
    baseAmount: toAmountFromCents(stored.baseAmountCents),
    baseLabel: stored.baseLabel,
    baseQualifier: stored.baseQualifier,
    unitCount: stored.unitCount,
    unitCountLabel: stored.unitCountLabel,
    baseTotalAmount: toAmountFromCents(stored.baseTotalAmountCents),
    baseTotalLabel: stored.baseTotalLabel,
    estimatedFeesAmount: toAmountFromCents(stored.estimatedFeesAmountCents),
    estimatedFeesLabel: stored.estimatedFeesLabel,
    totalAmount: toAmountFromCents(stored.totalAmountCents),
    totalLabel: stored.totalLabel,
    supportText: stored.supportText,
  }
}

export const resolveComparablePriceCents = (
  unitPriceCents: number | null | undefined,
  metadata: Record<string, unknown> | null | undefined,
) => {
  if (unitPriceCents == null) return null
  const unitPrice = Number(unitPriceCents)
  if (!Number.isFinite(unitPrice)) return null

  const stored = readStoredPriceDisplayMetadata(metadata)
  const multiplier = stored?.unitCount && stored.unitCount > 1 ? stored.unitCount : 1
  return Math.max(0, Math.round(unitPrice * multiplier))
}
