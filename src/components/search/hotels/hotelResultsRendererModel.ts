import type { CanonicalHotelSearchPageResult } from "~/server/search/loadCanonicalHotelSearchPage";
import type { HotelSearchRequest } from "~/types/search";
import type {
  CanonicalHotelSearchPageError,
  HotelResultsEmptyStateModel,
  HotelResultsErrorStateModel,
  HotelResultsLoadingStateModel,
  HotelResultsRendererModel,
} from "~/types/search-ui";

const buildHotelSearchHref = (request?: HotelSearchRequest, cityLabel?: string) => {
  if (!request) return "/hotels";

  const params = new URLSearchParams();
  params.set("destination", cityLabel || request.city);
  params.set("checkIn", request.checkIn);
  params.set("checkOut", request.checkOut);

  const query = params.toString();
  return query ? `/hotels?${query}` : "/hotels";
};

const buildCanonicalHotelRouteHref = (request?: HotelSearchRequest) => {
  if (!request) return "/hotels";
  return `/hotels/search/${request.city}/${request.checkIn}/${request.checkOut}`;
};

const buildLoadingModel = (): HotelResultsLoadingStateModel => ({
  title: "Loading hotel results",
  description: "Checking stay pricing, policies, and availability for this city.",
  placeholderCount: 3,
});

const buildEmptyModel = (
  request: HotelSearchRequest,
  cityLabel: string,
): HotelResultsEmptyStateModel => ({
  title: "No hotels were found for this search.",
  description: "Try different dates, a nearby destination, or a shorter stay.",
  primaryAction: {
    label: "Revise search",
    href: buildHotelSearchHref(request, cityLabel),
  },
  secondaryAction: {
    label: "Start a new search",
    href: "/hotels",
  },
});

const buildErrorCopy = (error: CanonicalHotelSearchPageError) => {
  if (error.code === "INVALID_CITY_SLUG") {
    return {
      title: "This hotel search needs a valid city.",
      description: "Use a supported city slug or choose a different destination, then try again.",
    };
  }

  if (error.code === "INVALID_DATE" || error.code === "INVALID_DATE_RANGE") {
    return {
      title: "This hotel search needs valid stay dates.",
      description: "Check the check-in and check-out dates, then run the search again.",
    };
  }

  if (error.field === "route" || error.code === "MISSING_REQUIRED_FIELD") {
    return {
      title: "This hotel search link is incomplete.",
      description: "The URL did not match a supported Andacity hotel search route.",
    };
  }

  return {
    title: "Hotel results are unavailable right now.",
    description: "The search looked valid, but the results service could not finish the request. Try again in a moment.",
  };
};

const buildErrorModel = (
  input: Pick<CanonicalHotelSearchPageResult, "status" | "request"> & {
    error: CanonicalHotelSearchPageError;
    currentPath?: string;
  },
): HotelResultsErrorStateModel => {
  const copy = buildErrorCopy(input.error);
  const retryHref = input.currentPath || buildCanonicalHotelRouteHref(input.request);

  return {
    title: copy.title,
    description: copy.description,
    statusLabel: `HTTP ${input.status}`,
    routeLabel: input.request ? input.request.city : null,
    retryHref,
    retryLabel: "Try again",
    backToSearchHref: buildHotelSearchHref(input.request),
    backToSearchLabel: input.request ? "Revise search" : "Start a new search",
  };
};

export const resolveHotelResultsRendererModel = (
  page: CanonicalHotelSearchPageResult,
  options: {
    isLoading?: boolean;
    currentPath?: string;
  } = {},
): HotelResultsRendererModel => {
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
      empty: buildEmptyModel(page.request, page.ui.summary.cityLabel),
    };
  }

  return {
    state: "results",
    summary: page.ui.summary,
    cards: page.ui.cards,
  };
};

export const buildCanonicalHotelRoutePath = buildCanonicalHotelRouteHref;
export const buildHotelSearchEditorHref = buildHotelSearchHref;
