import { parseInventoryId } from '~/lib/inventory/inventory-id'
import { resolveInventory } from '~/lib/inventory/resolveInventory'
import type { ProviderAdapter } from '~/lib/providers/providerAdapter'
import { getProvider } from '~/lib/providers/providerRegistry'
import type { BookableEntity } from '~/types/bookable-entity'
import type { PriceDriftResult, PriceQuote } from '~/types/pricing'

const DEFAULT_AMOUNT_TOLERANCE_CENTS = 1

export type DetectPriceDriftOptions = {
  provider?: string | null
  resolvedInventory?: BookableEntity | null
  resolveInventoryFn?: typeof resolveInventory
  getProviderFn?: typeof getProvider
  signal?: AbortSignal
  amountToleranceCents?: number
}

const toNullableText = (value: unknown) => {
  const text = String(value ?? '').trim()
  return text ? text : null
}

const normalizeCurrencyCode = (value: unknown) => {
  const token = toNullableText(value)?.toUpperCase() || null
  return token && /^[A-Z]{3}$/.test(token) ? token : null
}

const toFiniteNumber = (value: unknown) => {
  if (value == null || value === '') return null
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const toComparableAmountCents = (value: unknown) => {
  const parsed = toFiniteNumber(value)
  return parsed == null ? null : Math.round(parsed * 100)
}

const normalizePriceQuote = (quote: PriceQuote | null | undefined): PriceQuote | null => {
  if (!quote) return null

  const currency = normalizeCurrencyCode(quote.currency)
  const amount = toFiniteNumber(quote.amount)

  if (!currency || amount == null) {
    return null
  }

  const base = toFiniteNumber(quote.base)
  const daily = toFiniteNumber(quote.daily)
  const days = toFiniteNumber(quote.days)
  const nightly = toFiniteNumber(quote.nightly)
  const nights = toFiniteNumber(quote.nights)
  const taxes = toFiniteNumber(quote.taxes)
  const fees = toFiniteNumber(quote.fees)

  return {
    currency,
    amount,
    ...(base != null ? { base } : {}),
    ...(daily != null ? { daily } : {}),
    ...(days != null ? { days } : {}),
    ...(nightly != null ? { nightly } : {}),
    ...(nights != null ? { nights } : {}),
    ...(taxes != null ? { taxes } : {}),
    ...(fees != null ? { fees } : {}),
  }
}

const compareOptionalMoneyField = (
  left: number | undefined,
  right: number | undefined,
  toleranceCents: number,
) => {
  if (left == null || right == null) return true

  const leftCents = toComparableAmountCents(left)
  const rightCents = toComparableAmountCents(right)
  if (leftCents == null || rightCents == null) return false

  return Math.abs(leftCents - rightCents) <= toleranceCents
}

const compareOptionalCountField = (left: number | undefined, right: number | undefined) => {
  if (left == null || right == null) return true
  return left === right
}

const pricesMatch = (
  snapshotPrice: PriceQuote,
  livePrice: PriceQuote,
  amountToleranceCents: number,
) => {
  const snapshotCurrency = normalizeCurrencyCode(snapshotPrice.currency)
  const liveCurrency = normalizeCurrencyCode(livePrice.currency)
  if (!snapshotCurrency || !liveCurrency || snapshotCurrency !== liveCurrency) {
    return false
  }

  const snapshotAmountCents = toComparableAmountCents(snapshotPrice.amount)
  const liveAmountCents = toComparableAmountCents(livePrice.amount)
  if (snapshotAmountCents == null || liveAmountCents == null) {
    return false
  }

  if (Math.abs(snapshotAmountCents - liveAmountCents) > amountToleranceCents) {
    return false
  }

  return (
    compareOptionalMoneyField(snapshotPrice.base, livePrice.base, amountToleranceCents) &&
    compareOptionalMoneyField(snapshotPrice.daily, livePrice.daily, amountToleranceCents) &&
    compareOptionalMoneyField(snapshotPrice.nightly, livePrice.nightly, amountToleranceCents) &&
    compareOptionalMoneyField(snapshotPrice.taxes, livePrice.taxes, amountToleranceCents) &&
    compareOptionalMoneyField(snapshotPrice.fees, livePrice.fees, amountToleranceCents) &&
    compareOptionalCountField(snapshotPrice.days, livePrice.days) &&
    compareOptionalCountField(snapshotPrice.nights, livePrice.nights)
  )
}

const normalizeProviderKey = (value: string | null | undefined) =>
  String(value ?? '').trim().toLowerCase()

const resolveProviderAdapter = (
  inventoryId: string,
  options: DetectPriceDriftOptions,
): ProviderAdapter | null => {
  const parsedInventory = parseInventoryId(inventoryId)
  if (!parsedInventory) return null

  const getProviderFn = options.getProviderFn || getProvider
  const parsedProvider =
    parsedInventory.vertical === 'hotel' ? normalizeProviderKey(parsedInventory.provider) : ''
  const candidates = [
    normalizeProviderKey(options.provider),
    parsedProvider,
    normalizeProviderKey(parsedInventory.vertical),
  ]

  for (const candidate of candidates) {
    if (!candidate) continue
    const provider = getProviderFn(candidate)
    if (provider) return provider
  }

  return null
}

const resolveLiveInventory = async (
  inventoryId: string,
  options: DetectPriceDriftOptions,
) => {
  if (options.resolvedInventory !== undefined) {
    return options.resolvedInventory
  }

  const resolveInventoryFn = options.resolveInventoryFn || resolveInventory

  try {
    return await resolveInventoryFn(inventoryId, options.provider)
  } catch {
    return null
  }
}

export async function detectPriceDrift(
  inventoryId: string,
  snapshotPrice: PriceQuote,
  options: DetectPriceDriftOptions = {},
): Promise<PriceDriftResult> {
  const normalizedInventoryId = String(inventoryId || '').trim()
  const oldPrice = normalizePriceQuote(snapshotPrice)

  if (!normalizedInventoryId || !parseInventoryId(normalizedInventoryId) || !oldPrice) {
    return {
      status: 'unavailable',
      oldPrice,
      newPrice: null,
    }
  }

  const liveInventory = await resolveLiveInventory(normalizedInventoryId, options)
  if (!liveInventory) {
    return {
      status: 'unavailable',
      oldPrice,
      newPrice: null,
    }
  }

  const provider = resolveProviderAdapter(normalizedInventoryId, options)
  if (!provider) {
    return {
      status: 'unavailable',
      oldPrice,
      newPrice: null,
    }
  }

  let newPrice: PriceQuote | null = null

  try {
    newPrice = normalizePriceQuote(
      await provider.fetchPrice(normalizedInventoryId, {
        signal: options.signal,
      }),
    )
  } catch {
    newPrice = null
  }

  if (!newPrice) {
    return {
      status: 'unavailable',
      oldPrice,
      newPrice: null,
    }
  }

  return {
    status: pricesMatch(
      oldPrice,
      newPrice,
      Math.max(0, Math.round(options.amountToleranceCents ?? DEFAULT_AMOUNT_TOLERANCE_CENTS)),
    )
      ? 'valid'
      : 'price_changed',
    oldPrice,
    newPrice,
  }
}
