import { mapCarResultsForUi } from "~/server/search/mapCarResultsForUi";
import { parseSearchRoute } from "~/server/search/routeParser";
import {
  loadIncrementalSearchResultsApiResponse,
  loadSearchResultsApiResponse,
} from "~/server/search/searchResultsApi";
import type {
  CarSearchRequest,
  SearchResultsApiError,
  SearchResultsApiMetadata,
  SearchResultsApiResponse,
  SearchResultsIncrementalApiResponse,
  SearchResultsPageProgress,
} from "~/types/search";
import type { CarSearchEntity } from "~/types/search-entity";
import type { CarResultsPageUiModel } from "~/types/search-ui";

type SearchApiLoader = typeof loadSearchResultsApiResponse;
type ProgressiveSearchApiLoader = typeof loadIncrementalSearchResultsApiResponse;

type LoadCanonicalCarSearchPageDependencies = {
  loadSearchResultsApiResponse?: SearchApiLoader;
  loadIncrementalSearchResultsApiResponse?: ProgressiveSearchApiLoader;
  parseSearchRoute?: typeof parseSearchRoute;
  mapCarResultsForUi?: typeof mapCarResultsForUi;
};

export type CanonicalCarSearchPageSuccess = {
  status: 200;
  request: CarSearchRequest;
  metadata: SearchResultsApiMetadata;
  results: CarSearchEntity[];
  ui: CarResultsPageUiModel;
  progress?: SearchResultsPageProgress;
};

export type CanonicalCarSearchPageFailure = {
  status: number;
  error: SearchResultsApiError["error"];
  request?: CarSearchRequest;
};

export type CanonicalCarSearchPageResult =
  | CanonicalCarSearchPageSuccess
  | CanonicalCarSearchPageFailure;

const defaultDependencies: Required<LoadCanonicalCarSearchPageDependencies> = {
  loadSearchResultsApiResponse,
  loadIncrementalSearchResultsApiResponse,
  parseSearchRoute,
  mapCarResultsForUi,
};

const isCarSearchEntity = (value: unknown): value is CarSearchEntity =>
  typeof value === "object" && value !== null && "vertical" in value && value.vertical === "car";

const toUrl = (input: string | URL) => {
  if (input instanceof URL) return input;

  const text = String(input || "").trim();
  if (!text) return new URL("https://andacity.test/car-rentals/search");

  if (/^https?:\/\//i.test(text)) {
    return new URL(text);
  }

  return new URL(text.startsWith("/") ? text : `/${text}`, "https://andacity.test");
};

const toCanonicalCarRequest = (value: unknown) => {
  if (!value || typeof value !== "object") return null;
  if (!("type" in value) || value.type !== "car") return null;
  return value as CarSearchRequest;
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
    return toCanonicalCarRequest(parseRoute(url)) || undefined;
  } catch {
    return undefined;
  }
};

const toInternalError = (): CanonicalCarSearchPageFailure => ({
  status: 500,
  error: {
    code: "SEARCH_EXECUTION_FAILED",
    message: "Failed to load the canonical car search page.",
  },
});

const isCarSearchSuccessResponse = (
  value: SearchResultsApiResponse | SearchResultsApiError,
): value is SearchResultsApiResponse<CarSearchEntity> => {
  if (!value.ok) return false;
  if (value.data.request.type !== "car") return false;
  return value.data.results.every((result) => isCarSearchEntity(result));
};

const isCarSearchIncrementalSuccessResponse = (
  value: SearchResultsIncrementalApiResponse | SearchResultsApiError,
): value is SearchResultsIncrementalApiResponse<CarSearchEntity> => {
  if (!value.ok) return false;
  if (value.data.request.type !== "car") return false;
  return value.data.results.every((result) => isCarSearchEntity(result));
};

const toProgress = (
  endpoint: URL,
  metadata: SearchResultsIncrementalApiResponse<CarSearchEntity>["data"]["metadata"],
): SearchResultsPageProgress => ({
  endpoint: `${endpoint.pathname}${endpoint.search}`,
  searchKey: metadata.searchKey,
  status: metadata.status,
  cursor: metadata.cursor,
});

export const loadCanonicalCarSearchPage = async (
  input: string | URL,
  overrides: LoadCanonicalCarSearchPageDependencies = {},
): Promise<CanonicalCarSearchPageResult> => {
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

  if (!isCarSearchSuccessResponse(response.body)) {
    return toInternalError();
  }

  const request = response.body.data.request as CarSearchRequest;
  return {
    status: 200,
    request,
    results: response.body.data.results,
    metadata: response.body.data.metadata,
    ui: dependencies.mapCarResultsForUi({
      request,
      results: response.body.data.results,
      metadata: response.body.data.metadata,
    }),
  };
};

export const loadCanonicalCarSearchProgressivePage = async (
  input: string | URL,
  overrides: LoadCanonicalCarSearchPageDependencies = {},
): Promise<CanonicalCarSearchPageResult> => {
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

  if (!isCarSearchIncrementalSuccessResponse(response.body)) {
    return toInternalError();
  }

  const request = response.body.data.request as CarSearchRequest;
  return {
    status: 200,
    request,
    results: response.body.data.results,
    metadata: response.body.data.metadata,
    progress: toProgress(apiUrl, response.body.data.metadata),
    ui: dependencies.mapCarResultsForUi({
      request,
      results: response.body.data.results,
      metadata: response.body.data.metadata,
    }),
  };
};
