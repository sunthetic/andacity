import { toCarSearchEntity } from '~/lib/search/search-entity'
import type { SearchParams } from '~/types/search'
import type { CarSearchEntity } from '~/types/search-entity'
import type {
  CarPolicySummary,
  CarPriceSummary,
  CarProviderMetadata,
} from '~/types/car-rentals/provider'
import { CAR_PROVIDER_NAME } from './constants.ts'
import type { CarProviderRawOffer } from './carProviderClient.ts'

type NormalizeCarSearchResultOptions = {
  providerName?: string
  snapshotTimestamp?: string | null
}

const toNullableText = (value: unknown) => {
  const text = String(value ?? '').trim()
  return text ? text : null
}

const toPositiveInteger = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return null
  return Math.round(parsed)
}

const cloneStringArray = (value: string[] | null | undefined) =>
  Array.isArray(value) ? value.map((entry) => String(entry)) : null

const titleCase = (value: string | null) => {
  const text = toNullableText(value)
  if (!text) return null
  return `${text.slice(0, 1).toUpperCase()}${text.slice(1).toLowerCase()}`
}

export const buildCarProviderPolicy = (
  offer: Pick<
    CarProviderRawOffer,
    | 'freeCancellation'
    | 'payAtCounter'
    | 'securityDepositRequired'
    | 'airConditioning'
    | 'minDriverAge'
    | 'cancellationBlurb'
    | 'paymentBlurb'
    | 'feesBlurb'
    | 'depositBlurb'
  >,
): CarPolicySummary => ({
  freeCancellation: offer.freeCancellation ?? null,
  payAtCounter: offer.payAtCounter ?? null,
  securityDepositRequired: offer.securityDepositRequired ?? null,
  airConditioning: offer.airConditioning ?? null,
  minDriverAge: toPositiveInteger(offer.minDriverAge),
  cancellationLabel: toNullableText(offer.cancellationBlurb),
  paymentLabel: toNullableText(offer.paymentBlurb),
  feesLabel: toNullableText(offer.feesBlurb),
  depositLabel: toNullableText(offer.depositBlurb),
})

export const buildCarPriceSummary = (
  offer: Pick<
    CarProviderRawOffer,
    | 'priceDailyCents'
    | 'totalBaseCents'
    | 'taxesCents'
    | 'mandatoryFeesCents'
    | 'totalPriceCents'
    | 'days'
  >,
): CarPriceSummary => ({
  dailyBaseCents: offer.priceDailyCents,
  totalBaseCents: offer.totalBaseCents,
  taxesCents: offer.taxesCents,
  mandatoryFeesCents: offer.mandatoryFeesCents,
  totalPriceCents: offer.totalPriceCents,
  days: offer.days,
})

export const buildCarProviderMetadata = (
  offer: Pick<
    CarProviderRawOffer,
    | 'rentalCompany'
    | 'providerLocationId'
    | 'ratePlanCode'
    | 'inventorySlug'
    | 'pickupLocationName'
    | 'dropoffLocationName'
    | 'pickupLocationType'
    | 'dropoffLocationType'
    | 'pickupAddressLine'
    | 'dropoffAddressLine'
    | 'driverAge'
    | 'ratePlan'
    | 'fuelPolicy'
    | 'mileagePolicy'
  >,
  providerName = CAR_PROVIDER_NAME,
): CarProviderMetadata => ({
  providerName,
  rentalCompany: toNullableText(offer.rentalCompany),
  providerLocationId: toNullableText(offer.providerLocationId),
  providerOfferId: toNullableText(offer.ratePlanCode),
  inventorySlug: toNullableText(offer.inventorySlug),
  pickupLocationName: toNullableText(offer.pickupLocationName),
  dropoffLocationName: toNullableText(offer.dropoffLocationName),
  pickupLocationType: toNullableText(offer.pickupLocationType),
  dropoffLocationType: toNullableText(offer.dropoffLocationType),
  pickupAddressLine: toNullableText(offer.pickupAddressLine),
  dropoffAddressLine: toNullableText(offer.dropoffAddressLine),
  driverAge: toPositiveInteger(offer.driverAge),
  ratePlanCode: toNullableText(offer.ratePlanCode),
  ratePlan: toNullableText(offer.ratePlan),
  fuelPolicy: toNullableText(offer.fuelPolicy),
  mileagePolicy: toNullableText(offer.mileagePolicy),
})

export const normalizeCarSearchResult = (
  offer: CarProviderRawOffer,
  params: SearchParams,
  options: NormalizeCarSearchResultOptions = {},
): CarSearchEntity | null => {
  try {
    const providerName = options.providerName || CAR_PROVIDER_NAME
    const transmission = titleCase(offer.transmission)

    const entity = toCarSearchEntity(
      {
        inventoryId: offer.inventoryId,
        locationId: offer.providerLocationId,
        slug: offer.inventorySlug,
        name: offer.rentalCompany,
        pickupArea: offer.pickupLocationName,
        vehicleName: offer.vehicleName,
        category: offer.vehicleCategory || offer.vehicleClass,
        transmission,
        seats: offer.seats,
        priceFrom: Number((offer.priceDailyCents / 100).toFixed(2)),
        currency: offer.currencyCode,
        image: offer.imageUrl,
      },
      {
        providerLocationId: offer.providerLocationId,
        pickupDateTime: offer.pickupDateTime,
        dropoffDateTime: offer.dropoffDateTime,
        vehicleClass: offer.vehicleClass,
        priceAmountCents: offer.priceDailyCents,
        snapshotTimestamp:
          toNullableText(options.snapshotTimestamp) ??
          toNullableText(offer.freshnessTimestamp),
        imageUrl: offer.imageUrl,
        href: offer.href,
        assumedRentalWindow: offer.assumedRentalWindow,
      },
    )

    return {
      ...entity,
      metadata: {
        ...entity.metadata,
        transmission,
        seats: toPositiveInteger(offer.seats),
        pickupArea: toNullableText(offer.pickupLocationName),
        dropoffArea: toNullableText(offer.dropoffLocationName),
        luggageCapacity: toNullableText(offer.luggageCapacity),
        doors: toPositiveInteger(offer.doors),
        pickupLocationType: toNullableText(offer.pickupLocationType),
        dropoffLocationType: toNullableText(offer.dropoffLocationType),
      },
      payload: {
        ...entity.payload,
        pickupLocationName: toNullableText(offer.pickupLocationName),
        dropoffLocationName: toNullableText(offer.dropoffLocationName),
        pickupLocationType: toNullableText(offer.pickupLocationType),
        dropoffLocationType: toNullableText(offer.dropoffLocationType),
        pickupAddressLine: toNullableText(offer.pickupAddressLine),
        dropoffAddressLine: toNullableText(offer.dropoffAddressLine),
        transmissionType: transmission,
        seatingCapacity: toPositiveInteger(offer.seats),
        luggageCapacity: toNullableText(offer.luggageCapacity),
        doors: toPositiveInteger(offer.doors),
        airConditioning: offer.airConditioning ?? null,
        fuelPolicy: toNullableText(offer.fuelPolicy),
        mileagePolicy: toNullableText(offer.mileagePolicy),
        ratePlanCode: toNullableText(offer.ratePlanCode),
        ratePlan: toNullableText(offer.ratePlan),
        policy: buildCarProviderPolicy(offer),
        priceSummary: buildCarPriceSummary(offer),
        inclusions: cloneStringArray(offer.inclusions),
        badges: cloneStringArray(offer.badges),
        features: cloneStringArray(offer.features),
        providerMetadata: buildCarProviderMetadata(offer, providerName),
      },
    }
  } catch {
    void params
    return null
  }
}
