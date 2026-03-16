import type { CanonicalFlightSearchPageResult } from "~/server/search/loadCanonicalFlightSearchPage";
import type { FlightSearchRequest } from "~/types/search";
import type {
  CanonicalFlightSearchPageError,
  FlightResultsEmptyStateModel,
  FlightResultsErrorStateModel,
  FlightResultsLoadingStateModel,
  FlightResultsRendererModel,
} from "~/types/search-ui";

const buildFlightsSearchHref = (request?: FlightSearchRequest) => {
  if (!request) return "/flights";

  const params = new URLSearchParams();
  params.set("itineraryType", request.returnDate ? "round-trip" : "one-way");
  params.set("from", request.origin);
  params.set("to", request.destination);
  params.set("depart", request.departDate);

  if (request.returnDate) {
    params.set("return", request.returnDate);
  }

  const query = params.toString();
  return query ? `/flights?${query}` : "/flights";
};

const buildCanonicalFlightRouteHref = (request?: FlightSearchRequest) => {
  if (!request) return "/flights";

  const basePath = `/flights/search/${request.origin}-${request.destination}/${request.departDate}`;
  return request.returnDate ? `${basePath}/return/${request.returnDate}` : basePath;
};

const buildLoadingModel = (): FlightResultsLoadingStateModel => ({
  title: "Loading flight results",
  description: "Checking schedules, timing, and prices for this route.",
  placeholderCount: 3,
});

const buildEmptyModel = (request: FlightSearchRequest): FlightResultsEmptyStateModel => ({
  title: "No flights were found for this search.",
  description: "Try different dates, nearby airports, or a different route.",
  primaryAction: {
    label: "Revise search",
    href: buildFlightsSearchHref(request),
  },
  secondaryAction: {
    label: "Start a new search",
    href: "/flights",
  },
});

const buildErrorCopy = (error: CanonicalFlightSearchPageError) => {
  if (error.code === "INVALID_LOCATION_CODE") {
    return {
      title: "This flight search needs valid airport codes.",
      description: "Use supported 3-letter airport codes for the origin and destination, then try again.",
    };
  }

  if (error.code === "INVALID_DATE" || error.code === "INVALID_DATE_RANGE") {
    return {
      title: "This flight search needs valid travel dates.",
      description: "Check the departure and return dates, then run the search again.",
    };
  }

  if (error.field === "route" || error.code === "MISSING_REQUIRED_FIELD") {
    return {
      title: "This flight search link is incomplete.",
      description: "The URL did not match a supported Andacity flight search route.",
    };
  }

  return {
    title: "Flight results are unavailable right now.",
    description: "The search looked valid, but the results service could not finish the request. Try again in a moment.",
  };
};

const buildErrorModel = (
  input: Pick<CanonicalFlightSearchPageResult, "status" | "request"> & {
    error: CanonicalFlightSearchPageError;
    currentPath?: string;
  },
): FlightResultsErrorStateModel => {
  const copy = buildErrorCopy(input.error);
  const retryHref = input.currentPath || buildCanonicalFlightRouteHref(input.request);

  return {
    title: copy.title,
    description: copy.description,
    statusLabel: `HTTP ${input.status}`,
    routeLabel: input.request ? `${input.request.origin} -> ${input.request.destination}` : null,
    retryHref,
    retryLabel: "Try again",
    backToSearchHref: buildFlightsSearchHref(input.request),
    backToSearchLabel: input.request ? "Revise search" : "Start a new search",
  };
};

export const resolveFlightResultsRendererModel = (
  page: CanonicalFlightSearchPageResult,
  options: {
    isLoading?: boolean;
    currentPath?: string;
  } = {},
): FlightResultsRendererModel => {
  if (options.isLoading) {
    return {
      state: "loading",
      loading: buildLoadingModel(),
    };
  }

  if ("error" in page) {
    return {
      state: "error",
      error: buildErrorModel({
        status: page.status,
        error: page.error,
        request: page.request,
        currentPath: options.currentPath,
      }),
    };
  }

  if (!page.ui.cards.length) {
    return {
      state: "empty",
      summary: page.ui.summary,
      empty: buildEmptyModel(page.request),
    };
  }

  return {
    state: "results",
    summary: page.ui.summary,
    cards: page.ui.cards,
  };
};

export const buildCanonicalFlightRoutePath = buildCanonicalFlightRouteHref;
export const buildFlightSearchEditorHref = buildFlightsSearchHref;
