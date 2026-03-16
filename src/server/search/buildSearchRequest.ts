import { normalizeIsoDate } from "~/lib/date/validateDate";
import type { SearchVertical } from "~/types/search-entity";
import type {
  CarSearchRequest,
  FlightSearchRequest,
  HotelSearchRequest,
  SearchRequestError,
  SearchRequestResult,
} from "~/types/search";

const AIRPORT_CODE_PATTERN = /^[A-Za-z]{3}$/;
const CITY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const SEARCH_TYPE_ALIASES: Record<string, SearchVertical> = {
  car: "car",
  cars: "car",
  carrental: "car",
  carrentals: "car",
  "car-rental": "car",
  "car-rentals": "car",
  flight: "flight",
  flights: "flight",
  hotel: "hotel",
  hotels: "hotel",
  lodging: "hotel",
  rental: "car",
  rentals: "car",
  stay: "hotel",
  stays: "hotel",
};

export type SearchRequestInput = URLSearchParams | Record<string, unknown>;
type BuildSearchRequestFailure = Extract<SearchRequestResult, { ok: false }>;
type BuildSearchRequestSuccess<T> = {
  ok: true;
  data: T;
};

const toText = (value: unknown): string | null => {
  if (Array.isArray(value)) {
    for (const item of value) {
      const text = toText(item);
      if (text) return text;
    }

    return null;
  }

  const text = String(value ?? "").trim();
  return text || null;
};

const readInputValue = (input: SearchRequestInput, key: string) => {
  if (input instanceof URLSearchParams) {
    return input.get(key);
  }

  return input[key];
};

const readFirstInputValue = (input: SearchRequestInput, ...keys: string[]) => {
  for (const key of keys) {
    const value = readInputValue(input, key);
    if (toText(value)) return value;
  }

  return readInputValue(input, keys[0] || "");
};

const createError = (
  code: SearchRequestError["code"],
  message: string,
  options: {
    field?: string;
    value?: string | null;
  } = {},
): BuildSearchRequestFailure => ({
  ok: false,
  error: {
    code,
    message,
    ...(options.field ? { field: options.field } : {}),
    ...(options.value !== undefined ? { value: options.value } : {}),
  },
});

const createMissingFieldError = (field: string) =>
  createError("MISSING_REQUIRED_FIELD", `${field} is required.`, {
    field,
    value: null,
  });

const normalizeSearchType = (value: unknown) => {
  const text = toText(value)?.toLowerCase().replace(/[_\s]+/g, "-");
  if (!text) return null;
  return SEARCH_TYPE_ALIASES[text] ?? null;
};

const parseSearchType = (input: SearchRequestInput) => {
  const rawType = readFirstInputValue(input, "type", "vertical", "searchType");
  const type = normalizeSearchType(rawType);

  if (!type) {
    return createError(
      "INVALID_SEARCH_TYPE",
      "type must be one of flight, hotel, or car.",
      {
        field: "type",
        value: toText(rawType),
      },
    );
  }

  return {
    ok: true,
    data: type,
  } satisfies BuildSearchRequestSuccess<SearchVertical>;
};

const parseAirportCode = (
  input: SearchRequestInput,
  field: string,
  ...aliases: string[]
) => {
  const rawValue = readFirstInputValue(input, ...aliases);
  const text = toText(rawValue);
  if (!text) {
    return createMissingFieldError(field);
  }

  const code = text.toUpperCase();
  if (!AIRPORT_CODE_PATTERN.test(code)) {
    return createError("INVALID_LOCATION_CODE", `${field} must be a 3-letter airport code.`, {
      field,
      value: text,
    });
  }

  return {
    ok: true,
    data: code,
  } satisfies BuildSearchRequestSuccess<string>;
};

const parseCitySlug = (
  input: SearchRequestInput,
  field: string,
  ...aliases: string[]
) => {
  const rawValue = readFirstInputValue(input, ...aliases);
  const text = toText(rawValue);
  if (!text) {
    return createMissingFieldError(field);
  }

  const slug = text.toLowerCase();
  if (!CITY_SLUG_PATTERN.test(slug)) {
    return createError(
      "INVALID_CITY_SLUG",
      `${field} must be a lowercase kebab-case city slug.`,
      {
        field,
        value: text,
      },
    );
  }

  return {
    ok: true,
    data: slug,
  } satisfies BuildSearchRequestSuccess<string>;
};

const parseIsoDate = (
  input: SearchRequestInput,
  field: string,
  ...aliases: string[]
) => {
  const rawValue = readFirstInputValue(input, ...aliases);
  const text = toText(rawValue);
  if (!text) {
    return createMissingFieldError(field);
  }

  const isoDate = normalizeIsoDate(text);
  if (!isoDate) {
    return createError(
      "INVALID_DATE",
      `${field} must be a valid ISO date in YYYY-MM-DD format.`,
      {
        field,
        value: text,
      },
    );
  }

  return {
    ok: true,
    data: isoDate,
  } satisfies BuildSearchRequestSuccess<string>;
};

const parseOptionalIsoDate = (
  input: SearchRequestInput,
  field: string,
  ...aliases: string[]
) => {
  const rawValue = readFirstInputValue(input, ...aliases);
  const text = toText(rawValue);
  if (!text) {
    return {
      ok: true,
      data: undefined,
    } satisfies BuildSearchRequestSuccess<string | undefined>;
  }

  const isoDate = normalizeIsoDate(text);
  if (!isoDate) {
    return createError(
      "INVALID_DATE",
      `${field} must be a valid ISO date in YYYY-MM-DD format.`,
      {
        field,
        value: text,
      },
    );
  }

  return {
    ok: true,
    data: isoDate,
  } satisfies BuildSearchRequestSuccess<string | undefined>;
};

const validateDateRange = (startDate: string, endDate: string, startField: string, endField: string) => {
  if (endDate < startDate) {
    return createError("INVALID_DATE_RANGE", `${endField} must be on or after ${startField}.`, {
      field: endField,
      value: endDate,
    });
  }

  return null;
};

const buildFlightSearchRequest = (input: SearchRequestInput): SearchRequestResult => {
  const origin = parseAirportCode(input, "origin", "origin", "from", "originCode", "fromCode");
  if (!origin.ok) return origin;

  const destination = parseAirportCode(
    input,
    "destination",
    "destination",
    "to",
    "destinationCode",
    "toCode",
  );
  if (!destination.ok) return destination;

  if (origin.data === destination.data) {
    return createError(
      "INVALID_LOCATION_CODE",
      "destination must be different from origin.",
      {
        field: "destination",
        value: destination.data,
      },
    );
  }

  const departDate = parseIsoDate(
    input,
    "departDate",
    "departDate",
    "departureDate",
    "depart",
    "departure",
  );
  if (!departDate.ok) return departDate;

  const returnDate = parseOptionalIsoDate(
    input,
    "returnDate",
    "returnDate",
    "return",
    "ret",
    "returnOn",
  );
  if (!returnDate.ok) return returnDate;

  if (returnDate.data) {
    const dateRangeError = validateDateRange(
      departDate.data,
      returnDate.data,
      "departDate",
      "returnDate",
    );
    if (dateRangeError) return dateRangeError;
  }

  const request: FlightSearchRequest = {
    type: "flight",
    origin: origin.data,
    destination: destination.data,
    departDate: departDate.data,
    ...(returnDate.data ? { returnDate: returnDate.data } : {}),
  };

  return {
    ok: true,
    data: request,
  };
};

const buildHotelSearchRequest = (input: SearchRequestInput): SearchRequestResult => {
  const city = parseCitySlug(input, "city", "city", "citySlug", "destination", "destinationSlug");
  if (!city.ok) return city;

  const checkIn = parseIsoDate(input, "checkIn", "checkIn", "checkInDate");
  if (!checkIn.ok) return checkIn;

  const checkOut = parseIsoDate(input, "checkOut", "checkOut", "checkOutDate");
  if (!checkOut.ok) return checkOut;

  const dateRangeError = validateDateRange(
    checkIn.data,
    checkOut.data,
    "checkIn",
    "checkOut",
  );
  if (dateRangeError) return dateRangeError;

  const request: HotelSearchRequest = {
    type: "hotel",
    city: city.data,
    checkIn: checkIn.data,
    checkOut: checkOut.data,
  };

  return {
    ok: true,
    data: request,
  };
};

const buildCarSearchRequest = (input: SearchRequestInput): SearchRequestResult => {
  const airport = parseAirportCode(
    input,
    "airport",
    "airport",
    "airportCode",
    "pickupAirport",
  );
  if (!airport.ok) return airport;

  const pickupDate = parseIsoDate(
    input,
    "pickupDate",
    "pickupDate",
    "pickupOn",
    "departDate",
  );
  if (!pickupDate.ok) return pickupDate;

  const dropoffDate = parseIsoDate(
    input,
    "dropoffDate",
    "dropoffDate",
    "dropoffOn",
    "returnDate",
  );
  if (!dropoffDate.ok) return dropoffDate;

  const dateRangeError = validateDateRange(
    pickupDate.data,
    dropoffDate.data,
    "pickupDate",
    "dropoffDate",
  );
  if (dateRangeError) return dateRangeError;

  const request: CarSearchRequest = {
    type: "car",
    airport: airport.data,
    pickupDate: pickupDate.data,
    dropoffDate: dropoffDate.data,
  };

  return {
    ok: true,
    data: request,
  };
};

export const buildSearchRequest = (input: SearchRequestInput): SearchRequestResult => {
  const type = parseSearchType(input);
  if (!type.ok) return type;

  if (type.data === "flight") {
    return buildFlightSearchRequest(input);
  }

  if (type.data === "hotel") {
    return buildHotelSearchRequest(input);
  }

  return buildCarSearchRequest(input);
};
