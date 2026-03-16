import { mapFlightResultsForUi } from "~/server/search/mapFlightResultsForUi";
import { parseSearchRoute } from "~/server/search/routeParser";
import { loadSearchResultsApiResponse } from "~/server/search/searchResultsApi";
import type { FlightSearchRequest } from "~/types/search";
import type { SearchResultsApiError } from "~/types/search";
import type { SearchResultsApiMetadata } from "~/types/search";
import type { SearchResultsApiResponse } from "~/types/search";
import type { FlightSearchEntity } from "~/types/search-entity";
import type { FlightResultsPageUiModel } from "~/types/search-ui";

type SearchApiLoader = typeof loadSearchResultsApiResponse;

type LoadCanonicalFlightSearchPageDependencies = {
  loadSearchResultsApiResponse?: SearchApiLoader;
  parseSearchRoute?: typeof parseSearchRoute;
  mapFlightResultsForUi?: typeof mapFlightResultsForUi;
};

export type CanonicalFlightSearchPageSuccess = {
  status: 200;
  request: FlightSearchRequest;
  metadata: SearchResultsApiMetadata;
  ui: FlightResultsPageUiModel;
};

export type CanonicalFlightSearchPageFailure = {
  status: number;
  error: SearchResultsApiError["error"];
  request?: FlightSearchRequest;
};

export type CanonicalFlightSearchPageResult =
  | CanonicalFlightSearchPageSuccess
  | CanonicalFlightSearchPageFailure;

const defaultDependencies: Required<LoadCanonicalFlightSearchPageDependencies> = {
  loadSearchResultsApiResponse,
  parseSearchRoute,
  mapFlightResultsForUi,
};

const isFlightSearchEntity = (value: unknown): value is FlightSearchEntity =>
  typeof value === "object" && value !== null && "vertical" in value && value.vertical === "flight";

const toUrl = (input: string | URL) => {
  if (input instanceof URL) return input;

  const text = String(input || "").trim();
  if (!text) return new URL("https://andacity.test/flights/search");

  if (/^https?:\/\//i.test(text)) {
    return new URL(text);
  }

  return new URL(text.startsWith("/") ? text : `/${text}`, "https://andacity.test");
};

const toCanonicalFlightRequest = (value: unknown) => {
  if (!value || typeof value !== "object") return null;
  if (!("type" in value) || value.type !== "flight") return null;
  return value as FlightSearchRequest;
};

const buildApiUrl = (url: URL) => {
  const apiUrl = new URL("/api/search", url.origin || "https://andacity.test");
  apiUrl.searchParams.set("route", url.pathname);
  return apiUrl;
};

const readAttemptedRequest = (
  url: URL,
  parseRoute: typeof parseSearchRoute,
) => {
  try {
    return toCanonicalFlightRequest(parseRoute(url)) || undefined;
  } catch {
    return undefined;
  }
};

const toInternalError = (): CanonicalFlightSearchPageFailure => ({
  status: 500,
  error: {
    code: "SEARCH_EXECUTION_FAILED",
    message: "Failed to load the canonical flight search page.",
  },
});

const isFlightSearchSuccessResponse = (
  value: SearchResultsApiResponse | SearchResultsApiError,
): value is SearchResultsApiResponse<FlightSearchEntity> => {
  if (!value.ok) return false;
  if (value.data.request.type !== "flight") return false;
  return value.data.results.every((result) => isFlightSearchEntity(result));
};

export const loadCanonicalFlightSearchPage = async (
  input: string | URL,
  overrides: LoadCanonicalFlightSearchPageDependencies = {},
): Promise<CanonicalFlightSearchPageResult> => {
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

  if (!isFlightSearchSuccessResponse(response.body)) {
    return toInternalError();
  }

  const request = response.body.data.request as FlightSearchRequest;
  return {
    status: 200,
    request,
    metadata: response.body.data.metadata,
    ui: dependencies.mapFlightResultsForUi({
      request,
      results: response.body.data.results,
      metadata: response.body.data.metadata,
    }),
  };
};
