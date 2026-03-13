export type HotelPolicySummary = {
  refundable: boolean | null
  freeCancellation: boolean | null
  payLater: boolean | null
  cancellationLabel: string | null
}

export type HotelPriceSummary = {
  nightlyBaseCents: number | null
  totalBaseCents: number | null
  taxesCents: number | null
  mandatoryFeesCents: number | null
  totalPriceCents: number | null
  nights: number | null
}

export type HotelProviderMetadata = {
  providerName: string
  providerHotelId: string | null
  providerOfferId: string | null
  ratePlanId: string | null
  boardType: string | null
  cancellationPolicy: string | null
  checkInDate: string | null
  checkOutDate: string | null
  occupancy: number | null
}
