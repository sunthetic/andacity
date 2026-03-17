export type HotelPolicySummary = {
  refundable: boolean | null;
  freeCancellation: boolean | null;
  payLater: boolean | null;
  cancellationLabel: string | null;
};

export type HotelRoomSummary = {
  roomName: string | null;
  beds: string | null;
  sizeSqft: number | null;
  sleeps: number | null;
  features: string[] | null;
  badges: string[] | null;
};

export type HotelPropertySummary = {
  brandName: string | null;
  propertyType: string | null;
  cityName: string | null;
  neighborhood: string | null;
  addressLine: string | null;
  stars: number | null;
  rating: number | null;
  reviewCount: number | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  summary: string | null;
  amenities: string[] | null;
  notes: string[] | null;
};

export type HotelPriceSummary = {
  nightlyBaseCents: number | null;
  totalBaseCents: number | null;
  taxesCents: number | null;
  mandatoryFeesCents: number | null;
  totalPriceCents: number | null;
  nights: number | null;
};

export type HotelProviderMetadata = {
  providerName: string;
  providerHotelId: string | null;
  providerOfferId: string | null;
  ratePlanId: string | null;
  boardType: string | null;
  cancellationPolicy: string | null;
  checkInDate: string | null;
  checkOutDate: string | null;
  occupancy: number | null;
};
