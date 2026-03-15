import type { SearchVertical } from "~/types/search-entity";
import type { SearchEntity } from "~/types/search-entity";
import type { CanonicalLocation } from "~/types/location";

export type SearchRequest = {
  type: SearchVertical;
  origin?: string;
  destination?: string;
  city?: string;
  airport?: string;
  departDate?: string;
  returnDate?: string;
  checkIn?: string;
  checkOut?: string;
};

export type SearchRequestErrorCode =
  | "internal_error"
  | "invalid_date"
  | "invalid_location_code"
  | "location_not_found"
  | "malformed_route"
  | "provider_unavailable"
  | "unsupported_search_type";

export type SearchRequestError = {
  code: SearchRequestErrorCode;
  message: string;
  field?: string;
  value?: string | null;
};

export type SearchMetadata = {
  totalResults: number;
  providersQueried: string[];
  searchTime: number;
};

export type CanonicalSearchResponse<
  TResult extends SearchEntity = SearchEntity,
> = {
  results: TResult[];
  metadata: SearchMetadata;
};

export type NormalizedSearchResults = {
  request: SearchRequest;
  searchKey: string;
  cacheHit: boolean;
  provider: string | null;
  results: SearchEntity[];
};

export type SearchParamsFilters = {
  priceRange?: Array<string | number> | null;
  starRating?: Array<string | number> | null;
  guestRating?: Array<string | number> | null;
  amenities?: string[] | null;
  vehicleClass?: Array<string | number> | null;
  transmission?: string[] | null;
  pickupType?: string | null;
  seatsMin?: number | null;
  payAtCounterOnly?: boolean | null;
  refundableOnly?: boolean | null;
  sort?: string | null;
};

export type SearchParams = {
  vertical: SearchVertical;
  origin?: string;
  originLocation?: CanonicalLocation | null;
  destination?: string;
  destinationLocation?: CanonicalLocation | null;
  departDate?: string;
  returnDate?: string;
  checkInDate?: string;
  checkOutDate?: string;
  passengers?: number;
  occupancy?: number;
  adults?: number;
  children?: number;
  rooms?: number;
  pickupLocation?: string;
  pickupLocationData?: CanonicalLocation | null;
  dropoffLocation?: string;
  dropoffLocationData?: CanonicalLocation | null;
  driverAge?: number;
  filters?: SearchParamsFilters;
};
