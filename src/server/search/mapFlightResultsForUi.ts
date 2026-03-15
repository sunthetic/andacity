import { formatMoneyFromCents, toAmountFromCents } from "~/lib/pricing/price-display";
import type { SearchResultsApiMetadata } from "~/types/search";
import type { FlightSearchRequest } from "~/types/search";
import type { FlightSearchEntity } from "~/types/search-entity";
import type {
  FlightResultCardModel,
  FlightResultsPageUiModel,
  FlightSearchSummaryModel,
} from "~/types/search-ui";

const SUMMARY_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const DATE_PART_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const TIME_PART_FORMATTER = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

const toText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text || null;
};

const isIsoDate = (value: string | null | undefined) =>
  Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));

const parseIsoDate = (value: string | null | undefined) => {
  if (!isIsoDate(value)) return null;
  const [year, month, day] = String(value).split("-").map((part) => Number.parseInt(part, 10));
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseIsoDateTime = (value: string | null | undefined) => {
  const text = toText(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatIsoDateLabel = (value: string | null | undefined) => {
  const date = parseIsoDate(value);
  if (!date) return toText(value) || "Date unavailable";
  return SUMMARY_DATE_FORMATTER.format(date);
};

const formatDateTimeLabel = (value: string | null | undefined, fallbackDate?: string | null) => {
  const date = parseIsoDateTime(value);
  if (date) {
    return `${DATE_PART_FORMATTER.format(date)}, ${TIME_PART_FORMATTER.format(date)} UTC`;
  }

  if (fallbackDate) {
    return `${formatIsoDateLabel(fallbackDate)} · Time unavailable`;
  }

  return "Time unavailable";
};

const formatTokenLabel = (value: string | null | undefined) => {
  const text = toText(value);
  if (!text) return null;

  return text
    .split(/[-_\s]+/g)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
};

const formatDurationLabel = (minutes: number | null | undefined) => {
  const value = typeof minutes === "number" ? Math.max(0, Math.round(minutes)) : null;
  if (value == null) return "Duration unavailable";

  const hours = Math.floor(value / 60);
  const remainingMinutes = value % 60;
  if (hours <= 0) return `${remainingMinutes}m`;
  if (remainingMinutes <= 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
};

const deriveDurationMinutes = (result: FlightSearchEntity) => {
  if (typeof result.metadata.durationMinutes === "number") {
    return result.metadata.durationMinutes;
  }

  const departureAt = parseIsoDateTime(result.payload.departureAt);
  const arrivalAt = parseIsoDateTime(result.payload.arrivalAt);
  if (departureAt && arrivalAt) {
    return Math.max(0, Math.round((arrivalAt.getTime() - departureAt.getTime()) / 60000));
  }

  if (Array.isArray(result.payload.segments) && result.payload.segments.length) {
    const totalMinutes = result.payload.segments.reduce((sum, segment) => {
      const segmentMinutes =
        typeof segment.durationMinutes === "number" ? Math.max(0, Math.round(segment.durationMinutes)) : 0;
      return sum + segmentMinutes;
    }, 0);
    return totalMinutes > 0 ? totalMinutes : null;
  }

  return null;
};

const deriveStopCount = (result: FlightSearchEntity) => {
  if (typeof result.metadata.stops === "number") {
    return Math.max(0, Math.round(result.metadata.stops));
  }

  if (Array.isArray(result.payload.segments) && result.payload.segments.length) {
    return Math.max(0, result.payload.segments.length - 1);
  }

  return 0;
};

const deriveStopAirports = (result: FlightSearchEntity) => {
  if (!Array.isArray(result.payload.segments) || result.payload.segments.length <= 1) {
    return [];
  }

  return result.payload.segments
    .slice(0, -1)
    .map((segment) => toText(segment.destinationCode))
    .filter((value): value is string => Boolean(value));
};

const buildStopSummary = (stopCount: number, stopAirports: string[]) => {
  if (stopCount <= 0) return "Nonstop";
  if (!stopAirports.length) {
    return stopCount === 1 ? "1 stop" : `${stopCount} stops`;
  }

  const airportSummary = stopAirports.join(", ");
  return stopCount === 1 ? `1 stop via ${airportSummary}` : `${stopCount} stops via ${airportSummary}`;
};

const buildItinerarySummary = (result: FlightSearchEntity) => {
  if (!Array.isArray(result.payload.segments) || !result.payload.segments.length) {
    return null;
  }

  const firstOrigin = toText(result.payload.segments[0]?.originCode);
  const destinations = result.payload.segments
    .map((segment) => toText(segment.destinationCode))
    .filter((value): value is string => Boolean(value));
  const routeCodes = [firstOrigin, ...destinations].filter((value): value is string => Boolean(value));

  if (routeCodes.length <= 2) return null;
  return routeCodes.join(" -> ");
};

const buildFlightNumberLabel = (result: FlightSearchEntity) => {
  const airlineCode = toText(result.payload.airlineCode);
  const flightNumber = toText(result.payload.flightNumber ?? result.metadata.flightNumber);
  if (!airlineCode && !flightNumber) return null;
  return [airlineCode, flightNumber].filter(Boolean).join(" ");
};

const buildCabinLabel = (result: FlightSearchEntity) => {
  const cabinClass = formatTokenLabel(result.payload.cabinClass);
  const fareCode = toText(result.payload.fareCode);
  const fareLabel = fareCode ? `${fareCode.toUpperCase()} fare` : null;
  const parts = [cabinClass, fareLabel].filter((value): value is string => Boolean(value));
  return parts.length ? parts.join(" · ") : null;
};

const buildPriceModel = (result: FlightSearchEntity) => {
  const displayText = toText(result.price.displayText);
  const currency = toText(result.price.currency);
  const amount = toAmountFromCents(result.price.amountCents);

  if (displayText) {
    return {
      amount,
      currency,
      display: displayText,
    };
  }

  if (result.price.amountCents != null && currency) {
    return {
      amount,
      currency,
      display: formatMoneyFromCents(result.price.amountCents, currency, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    };
  }

  return {
    amount,
    currency,
    display: "Price unavailable",
  };
};

const buildRouteLabel = (originCode: string, destinationCode: string) => `${originCode} -> ${destinationCode}`;

export const mapFlightSearchSummaryForUi = (
  request: FlightSearchRequest,
  metadata: SearchResultsApiMetadata,
): FlightSearchSummaryModel => {
  const sourceLabel = metadata.cacheHit ? "Cached results" : "Fresh provider results";
  const providerLabel = metadata.providersQueried.length
    ? `Source: ${metadata.providersQueried.join(", ")}`
    : null;

  return {
    routeTitle: `${request.origin} -> ${request.destination}`,
    originCode: request.origin,
    destinationCode: request.destination,
    departDateLabel: formatIsoDateLabel(request.departDate),
    returnDateLabel: request.returnDate ? formatIsoDateLabel(request.returnDate) : null,
    tripTypeLabel: request.returnDate ? "Round-trip" : "One-way",
    resultCount: metadata.totalResults,
    resultCountLabel: `${metadata.totalResults.toLocaleString("en-US")} result${
      metadata.totalResults === 1 ? "" : "s"
    }`,
    statusLabel: sourceLabel,
    metadataBadges: [
      sourceLabel,
      providerLabel,
      `Search time ${metadata.searchTimeMs}ms`,
      "Sorted by best available match",
    ].filter((value): value is string => Boolean(value)),
  };
};

export const mapFlightResultCardForUi = (result: FlightSearchEntity): FlightResultCardModel => {
  const originCode = toText(result.payload.originCode ?? result.route.origin) || "Origin unavailable";
  const destinationCode =
    toText(result.payload.destinationCode ?? result.route.destination) || "Destination unavailable";
  const stopCount = deriveStopCount(result);
  const stopAirports = deriveStopAirports(result);

  return {
    id: result.inventoryId,
    airlineLabel:
      toText(result.metadata.carrier) || toText(result.provider) || toText(result.title) || "Flight option",
    providerLabel: toText(result.payload.providerMetadata?.providerName),
    flightNumberLabel: buildFlightNumberLabel(result),
    routeLabel: buildRouteLabel(originCode, destinationCode),
    originCode,
    destinationCode,
    departAtLabel: formatDateTimeLabel(result.payload.departureAt, result.route.departDate),
    arriveAtLabel: formatDateTimeLabel(result.payload.arrivalAt),
    durationLabel: formatDurationLabel(deriveDurationMinutes(result)),
    stopCount,
    stopSummary: buildStopSummary(stopCount, stopAirports),
    cabinLabel: buildCabinLabel(result),
    itinerarySummary: buildItinerarySummary(result),
    price: buildPriceModel(result),
    ctaLabel: "Select flight",
    ctaHref: null,
    ctaDisabled: true,
  };
};

export const mapFlightResultsForUi = (input: {
  request: FlightSearchRequest;
  results: FlightSearchEntity[];
  metadata: SearchResultsApiMetadata;
}): FlightResultsPageUiModel => ({
  summary: mapFlightSearchSummaryForUi(input.request, input.metadata),
  cards: input.results.map((result) => mapFlightResultCardForUi(result)),
});
