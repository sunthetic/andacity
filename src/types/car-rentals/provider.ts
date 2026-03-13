export type CarPolicySummary = {
  freeCancellation: boolean | null
  payAtCounter: boolean | null
  securityDepositRequired: boolean | null
  airConditioning: boolean | null
  minDriverAge: number | null
  cancellationLabel: string | null
  paymentLabel: string | null
  feesLabel: string | null
  depositLabel: string | null
}

export type CarPriceSummary = {
  dailyBaseCents: number | null
  totalBaseCents: number | null
  taxesCents: number | null
  mandatoryFeesCents: number | null
  totalPriceCents: number | null
  days: number | null
}

export type CarProviderMetadata = {
  providerName: string
  rentalCompany: string | null
  providerLocationId: string | null
  providerOfferId: string | null
  inventorySlug: string | null
  pickupLocationName: string | null
  dropoffLocationName: string | null
  pickupLocationType: string | null
  dropoffLocationType: string | null
  pickupAddressLine: string | null
  dropoffAddressLine: string | null
  driverAge: number | null
  ratePlanCode: string | null
  ratePlan: string | null
  fuelPolicy: string | null
  mileagePolicy: string | null
}
