import { mapHotelResultsForUi } from "~/server/search/mapHotelResultsForUi";
import { parseSearchRoute } from "~/server/search/routeParser";
import {
  loadIncrementalSearchResultsApiResponse,
  loadSearchResultsApiResponse,
} from "~/server/search/searchResultsApi";
import type {
  HotelSearchRequest,
  SearchResultsApiError,
  SearchResultsApiMetadata,
  SearchResultsApiResponse,
  SearchResultsIncrementalApiResponse,
  SearchResultsPageProgress,
} from "~/types/search";
import type { HotelSearchEntity } from "~/types/search-entity";
import type { HotelResultsPageUiModel } from "~/types/search-ui";

type SearchApiLoader = typeof loadSearchResultsApiResponse;
type ProgressiveSearchApiLoader = typeof loadIncrementalSearchResultsApiResponse;

type LoadCanonicalHotelSearchPageDependencies = {
  loadSearchResultsApiResponse?: SearchApiLoader;
  loadIncrementalSearchResultsApiResponse?: ProgressiveSearchApiLoader;
  parseSearchRoute?: typeof parseSearchRoute;
  mapHotelResultsForUi?: typeof mapHotelResultsForUi;
};

export type CanonicalHotelSearchPageSuccess = {
  status: 200;
  request: HotelSearchRequest;
  metadata: SearchResultsApiMetadata;
  results: HotelSearchEntity[];
  ui: HotelResultsPageUiModel;
  progress?: SearchResultsPageProgress;
};

export type CanonicalHotelSearchPageFailure = {
  status: number;
  error: SearchResultsApiError["error"];
  request?: HotelSearchRequest;
};

export type CanonicalHotelSearchPageResult =
  | CanonicalHotelSearchPageSuccess
  | CanonicalHotelSearchPageFailure;

const defaultDependencies: Required<LoadCanonicalHotelSearchPageDependencies> = {
  loadSearchResultsApiResponse,
  loadIncrementalSearchResultsApiResponse,
  parseSearchRoute,
  mapHotelResultsForUi,
};

const isHotelSearchEntity = (value: unknown): value is HotelSearchEntity =>
  typeof value === "object" && value !== null && "vertical" in value && value.vertical === "hotel";

const toUrl = (input: string | URL) => {
  if (input instanceof URL) return input;

  const text = String(input || "").trim();
  if (!text) return new URL("https://andacity.test/hotels/search");

  if (/^https?:\/\//i.test(text)) {
    return new URL(text);
  }

  return new URL(text.startsWith("/") ? text : `/${text}`, "https://andacity.test");
};

const toCanonicalHotelRequest = (value: unknown) => {
  if (!value || typeof value !== "object") return null;
  if (!("type" in value) || value.type !== "hotel") return null;
  return value as HotelSearchRequest;
};

const buildApiUrl = (url: URL) => {
  const apiUrl = new URL("/api/search", url.origin || "https://andacity.test");
  apiUrl.searchParams.set("route", url.pathname);
  return apiUrl;
};

const buildIncrementalApiUrl = (url: URL) => {
  const apiUrl = buildApiUrl(url);
  apiUrl.searchParams.set("incremental", "1");
  return apiUrl;
};

const readAttemptedRequest = (url: URL, parseRoute: typeof parseSearchRoute) => {
  try {
    return toCanonicalHotelRequest(parseRoute(url)) || undefined;
  } catch {
    return undefined;
  }
};

const toInternalError = (): CanonicalHotelSearchPageFailure => ({
  status: 500,
  error: {
    code: "SEARCH_EXECUTION_FAILED",
    message: "Failed to load the canonical hotel search page.",
  },
});

const isHotelSearchSuccessResponse = (
  value: SearchResultsApiResponse | SearchResultsApiError,
): value is SearchResultsApiResponse<HotelSearchEntity> => {
  if (!value.ok) return false;
  if (value.data.request.type !== "hotel") return false;
  return value.data.results.every((result) => isHotelSearchEntity(result));
};

const isHotelSearchIncrementalSuccessResponse = (
  value: SearchResultsIncrementalApiResponse | SearchResultsApiError,
): value is SearchResultsIncrementalApiResponse<HotelSearchEntity> => {
  if (!value.ok) return false;
  if (value.data.request.type !== "hotel") return false;
  return value.data.results.every((result) => isHotelSearchEntity(result));
};

const toProgress = (
  endpoint: URL,
  metadata: SearchResultsIncrementalApiResponse<HotelSearchEntity>["data"]["metadata"],
): SearchResultsPageProgress => ({
  endpoint: `${endpoint.pathname}${endpoint.search}`,
  searchKey: metadata.searchKey,
  status: metadata.status,
  cursor: metadata.cursor,
});

export const loadCanonicalHotelSearchPage = async (
  input: string | URL,
  overrides: LoadCanonicalHotelSearchPageDependencies = {},
): Promise<CanonicalHotelSearchPageResult> => {
  const dependencies = {
    ...defaultDependencies,
    ...overrides,
  };
  const url = toUrl(input);
  const attemptedRequest = readAttemptedRequest(url, dependencies.parseSearchRoute);
  const response = await dependencies.loadSearchResultsApiResponse(buildApiUrl(url));

  if (!response.body.ok) {
    return {
      status: response.status,
      error: response.body.error,
      request: attemptedRequest,
    };
  }

  if (!isHotelSearchSuccessResponse(response.body)) {
    return toInternalError();
  }

  const request = response.body.data.request as HotelSearchRequest;
  return {
    status: 200,
    request,
    results: response.body.data.results,
    metadata: response.body.data.metadata,
    ui: dependencies.mapHotelResultsForUi({
      request,
      results: response.body.data.results,
      metadata: response.body.data.metadata,
    }),
  };
};

export const loadCanonicalHotelSearchProgressivePage = async (
  input: string | URL,
  overrides: LoadCanonicalHotelSearchPageDependencies = {},
): Promise<CanonicalHotelSearchPageResult> => {
  const dependencies = {
    ...defaultDependencies,
    ...overrides,
  };
  const url = toUrl(input);
  const attemptedRequest = readAttemptedRequest(url, dependencies.parseSearchRoute);
  const apiUrl = buildIncrementalApiUrl(url);
  const response = await dependencies.loadIncrementalSearchResultsApiResponse(apiUrl);

  if (!response.body.ok) {
    return {
      status: response.status,
      error: response.body.error,
      request: attemptedRequest,
    };
  }

  if (!isHotelSearchIncrementalSuccessResponse(response.body)) {
    return toInternalError();
  }

  const request = response.body.data.request as HotelSearchRequest;
  return {
    status: 200,
    request,
    results: response.body.data.results,
    metadata: response.body.data.metadata,
    progress: toProgress(apiUrl, response.body.data.metadata),
    ui: dependencies.mapHotelResultsForUi({
      request,
      results: response.body.data.results,
      metadata: response.body.data.metadata,
    }),
  };
};
