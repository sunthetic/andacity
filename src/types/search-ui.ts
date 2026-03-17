import type {
  CarSearchRequest,
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
      state: "partial";
      summary: FlightSearchSummaryModel;
      cards: FlightResultCardModel[];
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
      state: "partial";
      summary: HotelSearchSummaryModel;
      cards: HotelResultCardModel[];
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

export type CarSearchSummaryModel = {
  searchTitle: string;
  pickupCode: string;
  dropoffCode: string;
  pickupDateLabel: string;
  dropoffDateLabel: string;
  rentalLengthDays: number | null;
  rentalLengthLabel: string;
  resultCount: number;
  resultCountLabel: string;
  statusLabel: string;
  metadataBadges: string[];
};

export type CarResultCardModel = {
  id: string;
  vehicleName: string;
  categoryLabel: string;
  brandLabel: string;
  providerLabel?: string | null;
  pickupCode: string;
  dropoffCode: string;
  pickupDateLabel: string;
  dropoffDateLabel: string;
  rentalLengthLabel: string;
  transmissionLabel: string;
  passengerLabel: string;
  baggageLabel: string;
  cancellationSummary: string;
  price: {
    totalAmount?: number | null;
    dailyAmount?: number | null;
    currency: string | null;
    totalDisplay: string;
    supportingDisplay?: string | null;
  };
  ctaLabel: string;
  ctaHref?: string | null;
  ctaDisabled?: boolean;
};

export type CarResultsPageUiModel = {
  summary: CarSearchSummaryModel;
  cards: CarResultCardModel[];
};

export type CarResultsEmptyStateModel = {
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

export type CarResultsErrorStateModel = {
  title: string;
  description: string;
  statusLabel: string;
  routeLabel?: string | null;
  retryHref: string;
  retryLabel: string;
  backToSearchHref: string;
  backToSearchLabel: string;
};

export type CarResultsLoadingStateModel = {
  title: string;
  description: string;
  placeholderCount: number;
};

export type CarResultsRendererModel =
  | {
      state: "loading";
      loading: CarResultsLoadingStateModel;
    }
  | {
      state: "partial";
      summary: CarSearchSummaryModel;
      cards: CarResultCardModel[];
      loading: CarResultsLoadingStateModel;
    }
  | {
      state: "error";
      error: CarResultsErrorStateModel;
    }
  | {
      state: "empty";
      summary: CarSearchSummaryModel;
      empty: CarResultsEmptyStateModel;
    }
  | {
      state: "results";
      summary: CarSearchSummaryModel;
      cards: CarResultCardModel[];
    };

export type CanonicalCarSearchPageError = SearchResultsApiError["error"];

export type CanonicalCarSearchAttempt = CarSearchRequest | undefined;
