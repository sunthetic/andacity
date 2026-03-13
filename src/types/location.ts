export type CanonicalLocationKind = "city" | "airport" | "station" | "region";

export type CanonicalLocation = {
  locationId: string;
  searchSlug: string;
  kind: CanonicalLocationKind;
  cityId: number | null;
  airportId: number | null;
  regionId: number | null;
  citySlug: string | null;
  cityName: string | null;
  airportName: string | null;
  airportCode: string | null;
  primaryAirportCode: string | null;
  stateOrProvinceName: string | null;
  stateOrProvinceCode: string | null;
  countryName: string;
  countryCode: string;
  displayName: string;
  latitude?: number;
  longitude?: number;
  providerMetadata?: Record<string, unknown>;
};
