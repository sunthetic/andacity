import type {
  CarSearchRequest,
  FlightSearchRequest,
  HotelSearchRequest,
} from "~/types/search";

export const ENTITY_RETURN_TO_QUERY_PARAM = "returnTo";
export const ENTITY_MODIFY_SEARCH_QUERY_PARAM = "modifySearch";

const toUrl = (value: string) =>
  new URL(value.startsWith("/") ? value : `/${value}`, "https://andacity.test");

const toRelativeHref = (value: string | null | undefined) => {
  const text = String(value || "").trim();
  if (!text.startsWith("/")) return null;
  return text;
};

const withQuery = (pathname: string, params: URLSearchParams) => {
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
};

export const appendEntitySearchFlow = (
  entityHref: string,
  context: {
    returnTo: string | null;
    modifySearch: string | null;
  },
) => {
  const url = toUrl(entityHref);

  if (context.returnTo) {
    url.searchParams.set(ENTITY_RETURN_TO_QUERY_PARAM, context.returnTo);
  }

  if (context.modifySearch) {
    url.searchParams.set(ENTITY_MODIFY_SEARCH_QUERY_PARAM, context.modifySearch);
  }

  return `${url.pathname}${url.search}`;
};

export const readEntitySearchFlow = (input: URL | URLSearchParams) => {
  const searchParams = input instanceof URL ? input.searchParams : input;

  return {
    returnTo: toRelativeHref(searchParams.get(ENTITY_RETURN_TO_QUERY_PARAM)),
    modifySearch: toRelativeHref(
      searchParams.get(ENTITY_MODIFY_SEARCH_QUERY_PARAM),
    ),
  };
};

export const buildFlightModifySearchHref = (
  request: FlightSearchRequest,
  currentPath: string,
) => {
  const currentUrl = toUrl(currentPath);
  const params = new URLSearchParams();

  params.set("itineraryType", request.returnDate ? "round-trip" : "one-way");
  params.set("depart", request.departDate);

  if (request.returnDate) {
    params.set("return", request.returnDate);
  }

  for (const key of [
    "from",
    "to",
    "fromLocationId",
    "toLocationId",
    "travelers",
    "cabin",
  ]) {
    const value = String(currentUrl.searchParams.get(key) || "").trim();
    if (value) {
      params.set(key, value);
    }
  }

  if (!params.get("from")) {
    params.set("from", request.origin);
  }

  if (!params.get("to")) {
    params.set("to", request.destination);
  }

  return withQuery("/flights", params);
};

export const buildHotelModifySearchHref = (
  request: HotelSearchRequest,
  currentPath: string,
) => {
  const currentUrl = toUrl(currentPath);
  const params = new URLSearchParams();

  params.set("checkIn", request.checkIn);
  params.set("checkOut", request.checkOut);

  for (const key of ["destination", "destinationLocationId", "guests"]) {
    const value = String(currentUrl.searchParams.get(key) || "").trim();
    if (value) {
      params.set(key, value);
    }
  }

  if (!params.get("destination")) {
    params.set("destination", request.city);
  }

  return withQuery("/hotels", params);
};

export const buildCarModifySearchHref = (
  request: CarSearchRequest,
  currentPath: string,
) => {
  const currentUrl = toUrl(currentPath);
  const params = new URLSearchParams();

  params.set("pickupDate", request.pickupDate);
  params.set("dropoffDate", request.dropoffDate);

  for (const key of ["q", "pickupLocationId", "drivers"]) {
    const value = String(currentUrl.searchParams.get(key) || "").trim();
    if (value) {
      params.set(key, value);
    }
  }

  if (!params.get("q")) {
    params.set("q", request.airport);
  }

  return withQuery("/car-rentals", params);
};
