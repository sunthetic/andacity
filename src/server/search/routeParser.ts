import { buildSearchRequest, type SearchRequestInput } from "~/server/search/buildSearchRequest";
import type { SearchRequest, SearchRequestError, SearchRequestErrorCode } from "~/types/search";

const toText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text || null;
};

const toRoutePath = (input: string | URL) => {
  if (input instanceof URL) {
    return input.pathname;
  }

  const text = String(input || "").trim();
  if (!text) return "/";

  if (/^https?:\/\//i.test(text)) {
    return new URL(text).pathname;
  }

  return new URL(text.startsWith("/") ? text : `/${text}`, "https://andacity.test").pathname;
};

const createSearchRouteError = (
  code: SearchRequestErrorCode,
  message: string,
  options: {
    field?: string;
    value?: string | null;
    status?: number;
  } = {},
) =>
  new SearchRouteError(code, message, {
    field: options.field,
    value: options.value,
    status: options.status,
  });

const unwrapSearchRequest = (input: SearchRequestInput) => {
  const result = buildSearchRequest(input);
  if (result.ok) {
    return result.data;
  }

  throw createSearchRouteError(result.error.code, result.error.message, {
    field: result.error.field,
    value: result.error.value,
  });
};

const parseFlightRoute = (segments: string[]) => {
  if (segments.length !== 4 && segments.length !== 6) {
    throw createSearchRouteError(
      "MALFORMED_ROUTE",
      "Flight routes must match /flights/search/{origin}-{destination}/{departDate} with optional /return/{returnDate}.",
      {
        field: "route",
      },
    );
  }

  const routeToken = toText(segments[2]);
  const routeParts = routeToken?.split("-") || [];
  if (routeParts.length !== 2) {
    throw createSearchRouteError(
      "MALFORMED_ROUTE",
      "Flight routes must include origin and destination separated by a hyphen.",
      {
        field: "route",
        value: routeToken,
      },
    );
  }

  if (segments.length === 6 && segments[4] !== "return") {
    throw createSearchRouteError(
      "MALFORMED_ROUTE",
      "Round-trip flight routes must include the /return/{returnDate} segment.",
      {
        field: "route",
        value: segments[4] || null,
      },
    );
  }

  const [origin, destination] = routeParts;
  return unwrapSearchRequest({
    type: "flight",
    origin,
    destination,
    departDate: segments[3],
    ...(segments.length === 6 ? { returnDate: segments[5] } : {}),
  });
};

const parseHotelRoute = (segments: string[]) => {
  if (segments.length !== 5) {
    throw createSearchRouteError(
      "MALFORMED_ROUTE",
      "Hotel routes must match /hotels/search/{citySlug}/{checkInDate}/{checkOutDate}.",
      {
        field: "route",
      },
    );
  }

  return unwrapSearchRequest({
    type: "hotel",
    city: segments[2],
    checkIn: segments[3],
    checkOut: segments[4],
  });
};

const parseCarRoute = (segments: string[]) => {
  if (segments.length !== 5) {
    throw createSearchRouteError(
      "MALFORMED_ROUTE",
      "Car routes must match /cars/search/{airportCode}/{pickupDate}/{dropoffDate}.",
      {
        field: "route",
      },
    );
  }

  return unwrapSearchRequest({
    type: "car",
    airport: segments[2],
    pickupDate: segments[3],
    dropoffDate: segments[4],
  });
};

export class SearchRouteError extends Error {
  code: SearchRequestErrorCode;
  field?: string;
  status: number;
  value?: string | null;

  constructor(
    code: SearchRequestErrorCode,
    message: string,
    options: {
      field?: string;
      value?: string | null;
      status?: number;
    } = {},
  ) {
    super(message);
    this.name = "SearchRouteError";
    this.code = code;
    this.field = options.field;
    this.value = options.value;
    this.status =
      options.status ??
      (code === "LOCATION_NOT_FOUND" ? 404 : code === "PROVIDER_UNAVAILABLE" ? 503 : 400);
  }

  toJSON(): SearchRequestError {
    return {
      code: this.code,
      message: this.message,
      ...(this.field ? { field: this.field } : {}),
      ...(this.value !== undefined ? { value: this.value } : {}),
    };
  }
}

export const isSearchRouteError = (value: unknown): value is SearchRouteError =>
  value instanceof SearchRouteError;

export const parseSearchRoute = (input: string | URL): SearchRequest => {
  const pathname = toRoutePath(input).replace(/\/+$/, "") || "/";
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length < 2 || segments[1] !== "search") {
    throw createSearchRouteError(
      "MALFORMED_ROUTE",
      "Search routes must begin with /{vertical}/search.",
      {
        field: "route",
        value: pathname,
      },
    );
  }

  switch (segments[0]) {
    case "flights":
      return parseFlightRoute(segments);

    case "hotels":
      return parseHotelRoute(segments);

    case "cars":
      return parseCarRoute(segments);

    default:
      throw createSearchRouteError(
        "INVALID_SEARCH_TYPE",
        `Unsupported search route vertical "${segments[0]}".`,
        {
          field: "route",
          value: segments[0],
        },
      );
  }
};

export const parseSearchRequestInput = (input: SearchRequestInput): SearchRequest =>
  unwrapSearchRequest(input);
