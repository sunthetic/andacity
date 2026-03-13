export type FlightItineraryType = "one-way" | "round-trip";

export type FlightSegmentSummary = {
  segmentOrder: number;
  marketingCarrier: string | null;
  marketingCarrierCode: string | null;
  operatingCarrier: string | null;
  operatingCarrierCode: string | null;
  flightNumber: string | null;
  originCode: string | null;
  destinationCode: string | null;
  departureAt: string | null;
  arrivalAt: string | null;
  durationMinutes: number | null;
};

export type FlightPolicySummary = {
  refundable: boolean | null;
  changeable: boolean | null;
  checkedBagsIncluded: number | null;
  seatsRemaining: number | null;
};

export type FlightProviderMetadata = {
  providerName: string;
  itineraryType: FlightItineraryType | null;
  requestedServiceDate: string | null;
  serviceDate: string | null;
};
