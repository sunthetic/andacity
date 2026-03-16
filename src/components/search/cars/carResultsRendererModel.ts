import type { CanonicalCarSearchPageResult } from "~/server/search/loadCanonicalCarSearchPage";
import type { CarSearchRequest } from "~/types/search";
import type {
  CanonicalCarSearchPageError,
  CarResultsEmptyStateModel,
  CarResultsErrorStateModel,
  CarResultsLoadingStateModel,
  CarResultsRendererModel,
} from "~/types/search-ui";

const buildCarSearchHref = (request?: CarSearchRequest) => {
  if (!request) return "/car-rentals";

  const params = new URLSearchParams();
  params.set("q", request.airport);
  params.set("pickupDate", request.pickupDate);
  params.set("dropoffDate", request.dropoffDate);

  const query = params.toString();
  return query ? `/car-rentals?${query}` : "/car-rentals";
};

const buildCanonicalCarRouteHref = (request?: CarSearchRequest) => {
  if (!request) return "/car-rentals";
  return `/cars/search/${request.airport}/${request.pickupDate}/${request.dropoffDate}`;
};

const buildLoadingModel = (): CarResultsLoadingStateModel => ({
  title: "Loading car results",
  description: "Checking vehicle availability, policies, and total pricing for this airport.",
  placeholderCount: 3,
});

const buildEmptyModel = (request: CarSearchRequest): CarResultsEmptyStateModel => ({
  title: "No cars were found for this search.",
  description: "Try different dates, a nearby airport, or another pickup location.",
  primaryAction: {
    label: "Revise search",
    href: buildCarSearchHref(request),
  },
  secondaryAction: {
    label: "Start a new search",
    href: "/car-rentals",
  },
});

const buildErrorCopy = (error: CanonicalCarSearchPageError) => {
  if (error.code === "INVALID_LOCATION_CODE") {
    return {
      title: "This car search needs a valid airport code.",
      description: "Use a supported 3-letter airport code for pickup and dropoff, then try again.",
    };
  }

  if (error.code === "INVALID_DATE" || error.code === "INVALID_DATE_RANGE") {
    return {
      title: "This car search needs valid rental dates.",
      description: "Check the pickup and dropoff dates, then run the search again.",
    };
  }

  if (error.field === "route" || error.code === "MISSING_REQUIRED_FIELD") {
    return {
      title: "This car search link is incomplete.",
      description: "The URL did not match a supported Andacity car search route.",
    };
  }

  return {
    title: "Car results are unavailable right now.",
    description: "The search looked valid, but the results service could not finish the request. Try again in a moment.",
  };
};

const buildErrorModel = (
  input: Pick<CanonicalCarSearchPageResult, "status" | "request"> & {
    error: CanonicalCarSearchPageError;
    currentPath?: string;
  },
): CarResultsErrorStateModel => {
  const copy = buildErrorCopy(input.error);
  const retryHref = input.currentPath || buildCanonicalCarRouteHref(input.request);

  return {
    title: copy.title,
    description: copy.description,
    statusLabel: `HTTP ${input.status}`,
    routeLabel: input.request ? input.request.airport : null,
    retryHref,
    retryLabel: "Try again",
    backToSearchHref: buildCarSearchHref(input.request),
    backToSearchLabel: input.request ? "Revise search" : "Start a new search",
  };
};

export const resolveCarResultsRendererModel = (
  page: CanonicalCarSearchPageResult,
  options: {
    isLoading?: boolean;
    currentPath?: string;
  } = {},
): CarResultsRendererModel => {
  const progressStatus =
    "error" in page ? null : (page.progress?.status ?? "complete");

  if (options.isLoading && progressStatus === "complete") {
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

  if (progressStatus === "loading") {
    return {
      state: "loading",
      loading: buildLoadingModel(),
    };
  }

  if (progressStatus === "partial") {
    return {
      state: "partial",
      summary: page.ui.summary,
      cards: page.ui.cards,
      loading: buildLoadingModel(),
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

export const buildCanonicalCarRoutePath = buildCanonicalCarRouteHref;
export const buildCarSearchEditorHref = buildCarSearchHref;
