import type {
  FlightSearchRequest,
  HotelSearchRequest,
  SearchResultsApiError,
} from "~/types/search";

export type FlightSearchSummaryModel = {
  routeTitle: string;
  originCode: string;
  destinationCode: string;
  departDateLabel: string;
  returnDateLabel?: string | null;
  tripTypeLabel: string;
  resultCount: number;
  resultCountLabel: string;
  statusLabel: string;
  metadataBadges: string[];
};

export type FlightResultCardModel = {
  id: string;
  airlineLabel: string;
  providerLabel?: string | null;
  flightNumberLabel?: string | null;
  routeLabel: string;
  originCode: string;
  destinationCode: string;
  departAtLabel: string;
  arriveAtLabel: string;
  durationLabel: string;
  stopCount: number;
  stopSummary: string;
  cabinLabel?: string | null;
  itinerarySummary?: string | null;
  price: {
    amount: number | null;
    currency: string | null;
    display: string;
  };
  ctaLabel: string;
  ctaHref?: string | null;
  ctaDisabled?: boolean;
};

export type FlightResultsPageUiModel = {
  summary: FlightSearchSummaryModel;
  cards: FlightResultCardModel[];
};

export type FlightResultsEmptyStateModel = {
  title: string;
  description: string;
  primaryAction: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
};

export type FlightResultsErrorStateModel = {
  title: string;
  description: string;
  statusLabel: string;
  routeLabel?: string | null;
  retryHref: string;
  retryLabel: string;
  backToSearchHref: string;
  backToSearchLabel: string;
};

export type FlightResultsLoadingStateModel = {
  title: string;
  description: string;
  placeholderCount: number;
};

export type FlightResultsRendererModel =
  | {
      state: "loading";
      loading: FlightResultsLoadingStateModel;
    }
  | {
      state: "error";
      error: FlightResultsErrorStateModel;
    }
  | {
      state: "empty";
      summary: FlightSearchSummaryModel;
      empty: FlightResultsEmptyStateModel;
    }
  | {
      state: "results";
      summary: FlightSearchSummaryModel;
      cards: FlightResultCardModel[];
    };

export type CanonicalFlightSearchPageError = SearchResultsApiError["error"];

export type CanonicalFlightSearchAttempt = FlightSearchRequest | undefined;

export type HotelSearchSummaryModel = {
  cityLabel: string;
  checkInDateLabel: string;
  checkOutDateLabel: string;
  stayLengthNights: number | null;
  stayLengthLabel: string;
  resultCount: number;
  resultCountLabel: string;
  statusLabel: string;
  metadataBadges: string[];
};

export type HotelResultCardModel = {
  id: string;
  hotelName: string;
  cityLabel: string;
  areaLabel?: string | null;
  starRating?: number | null;
  guestScore?: number | null;
  reviewCount?: number | null;
  offerSummary?: string | null;
  amenitiesSummary: string[];
  cancellationSummary?: string | null;
  policySummary?: string | null;
  price: {
    totalAmount?: number | null;
    nightlyAmount?: number | null;
    currency: string | null;
    totalDisplay: string;
    nightlyDisplay?: string | null;
  };
  imageUrl?: string | null;
  detailHref?: string | null;
  ctaLabel: string;
  ctaHref?: string | null;
  ctaDisabled?: boolean;
};

export type HotelResultsPageUiModel = {
  summary: HotelSearchSummaryModel;
  cards: HotelResultCardModel[];
};

export type HotelResultsEmptyStateModel = {
  title: string;
  description: string;
  primaryAction: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
};

export type HotelResultsErrorStateModel = {
  title: string;
  description: string;
  statusLabel: string;
  routeLabel?: string | null;
  retryHref: string;
  retryLabel: string;
  backToSearchHref: string;
  backToSearchLabel: string;
};

export type HotelResultsLoadingStateModel = {
  title: string;
  description: string;
  placeholderCount: number;
};

export type HotelResultsRendererModel =
  | {
      state: "loading";
      loading: HotelResultsLoadingStateModel;
    }
  | {
      state: "error";
      error: HotelResultsErrorStateModel;
    }
  | {
      state: "empty";
      summary: HotelSearchSummaryModel;
      empty: HotelResultsEmptyStateModel;
    }
  | {
      state: "results";
      summary: HotelSearchSummaryModel;
      cards: HotelResultCardModel[];
    };

export type CanonicalHotelSearchPageError = SearchResultsApiError["error"];

export type CanonicalHotelSearchAttempt = HotelSearchRequest | undefined;
