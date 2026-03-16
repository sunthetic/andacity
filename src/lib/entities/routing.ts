import { parseInventoryId } from "~/lib/inventory/inventory-id";
import type { BookableVertical } from "~/types/bookable-entity";
import type {
  BookableEntityRouteErrorCode,
  BookableEntityRouteErrorShape,
  ParsedBookableEntityRoute,
} from "~/types/bookable-entity-route";

const ROUTE_BASE_SEGMENTS: Record<BookableVertical, readonly [string, string]> = {
  flight: ["flights", "itinerary"],
  hotel: ["hotels", "stay"],
  car: ["cars", "rental"],
};

const ROUTE_SEGMENT_COUNTS: Record<BookableVertical, readonly number[]> = {
  flight: [5],
  hotel: [2, 5],
  car: [4],
};

const SEARCH_HREFS: Record<BookableVertical, string> = {
  flight: "/flights/search",
  hotel: "/hotels/search",
  car: "/cars/search",
};

const BROWSE_HREFS: Record<BookableVertical, string> = {
  flight: "/flights",
  hotel: "/hotels",
  car: "/car-rentals",
};

const VERTICAL_LABELS: Record<BookableVertical, string> = {
  flight: "Flights",
  hotel: "Hotels",
  car: "Cars",
};

const toText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text || null;
};

const toPathname = (input: string | URL) => {
  if (input instanceof URL) {
    return input.pathname;
  }

  const text = toText(input);
  if (!text) return "/";

  if (/^https?:\/\//i.test(text)) {
    return new URL(text).pathname;
  }

  return new URL(text.startsWith("/") ? text : `/${text}`, "https://andacity.test").pathname;
};

const encodeRouteSegment = (value: string) => encodeURIComponent(value);

const decodeRouteSegment = (value: string, field = "route") => {
  const text = toText(value);
  if (!text) {
    throw new BookableEntityRouteError("MALFORMED_ROUTE", "Route segments must not be empty.", {
      field,
      value: text,
    });
  }

  try {
    return decodeURIComponent(text);
  } catch {
    throw new BookableEntityRouteError("MALFORMED_ROUTE", "Route segments must be valid URI components.", {
      field,
      value: text,
    });
  }
};

const readInventoryId = (input: string | { inventoryId: string }) => {
  if (typeof input === "string") {
    return input;
  }

  return input.inventoryId;
};

const buildRouteError = (
  code: BookableEntityRouteErrorCode,
  message: string,
  options: {
    field?: string;
    value?: string | null;
    status?: number;
  } = {},
) =>
  new BookableEntityRouteError(code, message, {
    field: options.field,
    value: options.value,
    status: options.status,
  });

const resolveVerticalFromSegments = (segments: string[]): BookableVertical | null => {
  if (segments.length < 2) return null;

  if (segments[0] === "flights" && segments[1] === "itinerary") return "flight";
  if (segments[0] === "hotels" && segments[1] === "stay") return "hotel";
  if (segments[0] === "cars" && segments[1] === "rental") return "car";
  return null;
};

const assertRoutePrefix = (vertical: BookableVertical, segments: string[], pathname: string) => {
  const [expectedRoot, expectedLeaf] = ROUTE_BASE_SEGMENTS[vertical];
  if (segments[0] === expectedRoot && segments[1] === expectedLeaf) {
    return;
  }

  throw buildRouteError(
    "INVALID_ROUTE_PREFIX",
    `Canonical ${vertical} entity routes must begin with ${getBookableEntityRouteBase(vertical)}.`,
    {
      field: "route",
      value: pathname,
      status: 400,
    },
  );
};

const parseDecodedSegments = (
  vertical: BookableVertical,
  rawSegments: readonly string[],
  pathname: string,
): ParsedBookableEntityRoute => {
  if (!ROUTE_SEGMENT_COUNTS[vertical].includes(rawSegments.length)) {
    throw buildRouteError(
      "MALFORMED_ROUTE",
      `Canonical ${vertical} entity routes must include a valid canonical inventory path.`,
      {
        field: "route",
        value: pathname,
      },
    );
  }

  const decodedSegments = rawSegments.map((segment, index) =>
    decodeRouteSegment(segment, `segment_${index + 1}`),
  );
  const inventoryId = [vertical, ...decodedSegments].join(":");
  const parsedInventory = parseInventoryId(inventoryId);

  if (!parsedInventory || parsedInventory.vertical !== vertical) {
    throw buildRouteError(
      "INVALID_INVENTORY_ID",
      `Route does not encode a valid canonical ${vertical} inventory ID.`,
      {
        field: "route",
        value: pathname,
      },
    );
  }

  const canonicalPath = buildBookableEntityPath(parsedInventory.inventoryId);

  return {
    vertical,
    inventoryId: parsedInventory.inventoryId,
    parsedInventory,
    canonicalPath,
    pathname,
    segments: decodedSegments,
  };
};

export class BookableEntityRouteError extends Error {
  code: BookableEntityRouteErrorCode;
  field?: string;
  status: number;
  value?: string | null;

  constructor(
    code: BookableEntityRouteErrorCode,
    message: string,
    options: {
      field?: string;
      value?: string | null;
      status?: number;
    } = {},
  ) {
    super(message);
    this.name = "BookableEntityRouteError";
    this.code = code;
    this.field = options.field;
    this.value = options.value;
    this.status = options.status ?? 400;
  }

  toJSON(): BookableEntityRouteErrorShape {
    return {
      code: this.code,
      message: this.message,
      ...(this.field ? { field: this.field } : {}),
      ...(this.value !== undefined ? { value: this.value } : {}),
    };
  }
}

export const isBookableEntityRouteError = (
  value: unknown,
): value is BookableEntityRouteError => value instanceof BookableEntityRouteError;

export const getBookableEntityRouteBase = (vertical: BookableVertical) =>
  `/${ROUTE_BASE_SEGMENTS[vertical].join("/")}`;

export const getBookableEntitySearchHref = (vertical: BookableVertical) =>
  SEARCH_HREFS[vertical];

export const getBookableEntityBrowseHref = (vertical: BookableVertical) =>
  BROWSE_HREFS[vertical];

export const getBookableEntityVerticalLabel = (vertical: BookableVertical) =>
  VERTICAL_LABELS[vertical];

export const buildBookableEntityPath = (input: string | { inventoryId: string }) => {
  const inventoryId = toText(readInventoryId(input));
  const parsedInventory = inventoryId ? parseInventoryId(inventoryId) : null;

  if (!parsedInventory) {
    throw new Error("Cannot build a canonical entity path from a non-canonical inventory ID.");
  }

  const routeBase = getBookableEntityRouteBase(parsedInventory.vertical);
  const routeSegments = parsedInventory.inventoryId
    .split(":")
    .slice(1)
    .map((segment) => encodeRouteSegment(segment));

  return `${routeBase}/${routeSegments.join("/")}`;
};

const buildVerticalPath = (vertical: BookableVertical, input: string | { inventoryId: string }) => {
  const inventoryId = toText(readInventoryId(input));
  const parsedInventory = inventoryId ? parseInventoryId(inventoryId) : null;

  if (!parsedInventory || parsedInventory.vertical !== vertical) {
    throw new Error(`Cannot build a ${vertical} entity href from a mismatched inventory ID.`);
  }

  return buildBookableEntityPath(parsedInventory.inventoryId);
};

export const buildFlightEntityHref = (input: string | { inventoryId: string }) =>
  buildVerticalPath("flight", input);

export const buildHotelEntityHref = (input: string | { inventoryId: string }) =>
  buildVerticalPath("hotel", input);

export const buildCarEntityHref = (input: string | { inventoryId: string }) =>
  buildVerticalPath("car", input);

export const parseBookableEntityRoute = (input: string | URL): ParsedBookableEntityRoute => {
  const pathname = toPathname(input).replace(/\/+$/, "") || "/";
  const segments = pathname.split("/").filter(Boolean);
  const vertical = resolveVerticalFromSegments(segments);

  if (!vertical) {
    throw buildRouteError(
      "INVALID_ROUTE_PREFIX",
      "Canonical entity routes must begin with /flights/itinerary, /hotels/stay, or /cars/rental.",
      {
        field: "route",
        value: pathname,
      },
    );
  }

  return parseDecodedSegments(vertical, segments.slice(2), pathname);
};

export const parseBookableEntityRouteForVertical = (
  vertical: BookableVertical,
  input: string | URL | readonly string[],
): ParsedBookableEntityRoute => {
  if (typeof input !== "string" && !(input instanceof URL)) {
    const pathname = `${getBookableEntityRouteBase(vertical)}/${input.join("/")}`.replace(/\/+$/, "");
    return parseDecodedSegments(vertical, input, pathname);
  }

  const pathname = toPathname(input).replace(/\/+$/, "") || "/";
  const segments = pathname.split("/").filter(Boolean);

  assertRoutePrefix(vertical, segments, pathname);
  return parseDecodedSegments(vertical, segments.slice(2), pathname);
};

export const isBookableEntityPath = (value: unknown) => {
  const text = toText(value);
  if (!text) return false;

  try {
    parseBookableEntityRoute(text);
    return true;
  } catch {
    return false;
  }
};
