import type { SearchVertical } from "~/types/search-entity";
import type { SearchEntity } from "~/types/search-entity";
import type { CanonicalLocation } from "~/types/location";

export type FlightSearchRequest = {
  type: "flight";
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
};

export type HotelSearchRequest = {
  type: "hotel";
  city: string;
  checkIn: string;
  checkOut: string;
};

export type CarSearchRequest = {
  type: "car";
  airport: string;
  pickupDate: string;
  dropoffDate: string;
};

export type SearchRequest =
  | FlightSearchRequest
  | HotelSearchRequest
  | CarSearchRequest;

export type SearchRequestErrorCode =
  | "INTERNAL_ERROR"
  | "INVALID_CITY_SLUG"
  | "INVALID_DATE"
  | "INVALID_DATE_RANGE"
  | "INVALID_LOCATION_CODE"
  | "INVALID_SEARCH_TYPE"
  | "LOCATION_NOT_FOUND"
  | "MALFORMED_ROUTE"
  | "MISSING_REQUIRED_FIELD"
  | "PROVIDER_UNAVAILABLE";

export type SearchRequestError = {
  code: SearchRequestErrorCode;
  message: string;
  field?: string;
  value?: string | null;
};

export type SearchRequestResult =
  | {
      ok: true;
      data: SearchRequest;
    }
  | {
      ok: false;
      error: SearchRequestError;
    };

export type SearchResultsApiErrorCode =
  | "INVALID_SEARCH_TYPE"
  | "MISSING_REQUIRED_FIELD"
  | "INVALID_LOCATION_CODE"
  | "INVALID_CITY_SLUG"
  | "INVALID_DATE"
  | "INVALID_DATE_RANGE"
  | "SEARCH_EXECUTION_FAILED";

export type SearchResultsApiMetadata = {
  vertical: SearchRequest["type"];
  totalResults: number;
  providersQueried: string[];
  cacheHit: boolean;
  searchTimeMs: number;
};

export type SearchResultsLoadState = "loading" | "partial" | "complete";

export type SearchResultsIncrementalBatch<
  TResult extends SearchEntity = SearchEntity,
> = {
  cursor: number;
  provider: string;
  providerIndex: number;
  receivedAt: string;
  totalResults: number;
  results: TResult[];
};

export type SearchResultsIncrementalMetadata = SearchResultsApiMetadata & {
  searchKey: string;
  status: SearchResultsLoadState;
  cursor: number;
  batchCount: number;
  providersCompleted: string[];
  providersPending: string[];
};

export type SearchResultsPageProgress = {
  endpoint: string;
  searchKey: string;
  status: SearchResultsLoadState;
  cursor: number;
};

export type SearchResultsApiResponse<
  TResult extends SearchEntity = SearchEntity,
> = {
  ok: true;
  data: {
    request: SearchRequest;
    results: TResult[];
    metadata: SearchResultsApiMetadata;
  };
};

export type SearchResultsIncrementalApiResponse<
  TResult extends SearchEntity = SearchEntity,
> = {
  ok: true;
  data: {
    request: SearchRequest;
    results: TResult[];
    batches: SearchResultsIncrementalBatch<TResult>[];
    metadata: SearchResultsIncrementalMetadata;
  };
};

export type SearchResultsApiError = {
  ok: false;
  error: {
    code: SearchResultsApiErrorCode;
    field?: string;
    message: string;
  };
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
  providers: string[];
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
  pickupDate?: string;
  dropoffDate?: string;
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
