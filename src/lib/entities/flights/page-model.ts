import {
  buildAvailabilityConfidence,
  type AvailabilityMatchState,
} from "~/lib/inventory/availability-confidence";
import { buildInventoryFreshness } from "~/lib/inventory/freshness";
import {
  getBookableEntityBrowseHref,
  getBookableEntityRouteBase,
  getBookableEntitySearchHref,
  getBookableEntityVerticalLabel,
} from "~/lib/entities/routing";
import { formatMoneyFromCents } from "~/lib/pricing/price-display";
import type { FlightBookableEntity } from "~/types/bookable-entity";
import type { BookableEntityPageLoadResult } from "~/types/bookable-entity-route";
import type {
  FlightEntityDetailItemModel,
  FlightEntityErrorStateModel,
  FlightFareSummaryModel,
  FlightEntityPageUiModel,
  FlightEntitySegmentModel,
  FlightEntityStatusModel,
  FlightEntitySummaryModel,
  FlightEntityUnavailableStateModel,
} from "~/types/flight-entity-page";

const TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

const toText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text || null;
};

const toDate = (value: string | null | undefined) => {
  const text = toText(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
};

const titleCaseToken = (value: string | null | undefined) => {
  const text = toText(value);
  if (!text) return null;

  return text
    .split(/[-_\s]+/g)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
};

const formatTimestamp = (value: string | null | undefined) => {
  const date = toDate(value);
  if (!date) return toText(value) || "Time unavailable";
  return `${TIME_FORMATTER.format(date)} UTC`;
};

const formatDateTimeLabel = (value: string | null | undefined, fallbackDate?: string | null) => {
  const date = toDate(value);
  if (date) {
    return `${TIME_FORMATTER.format(date)} UTC`;
  }

  const fallback = toText(fallbackDate);
  return fallback ? `${fallback} · Time unavailable` : "Time unavailable";
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

const diffMinutes = (start: string | null | undefined, end: string | null | undefined) => {
  const startDate = toDate(start);
  const endDate = toDate(end);
  if (!startDate || !endDate) return null;

  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000));
};

const formatStopSummary = (stopCount: number, stopAirports: string[]) => {
  if (stopCount <= 0) return "Nonstop";
  if (!stopAirports.length) {
    return stopCount === 1 ? "1 stop" : `${stopCount} stops`;
  }

  const airportSummary = stopAirports.join(", ");
  return stopCount === 1 ? `1 stop via ${airportSummary}` : `${stopCount} stops via ${airportSummary}`;
};

const formatRefundability = (entity: FlightBookableEntity) => {
  const refundable = entity.payload.policy?.refundable;
  if (refundable === true) return "Refundable";
  if (refundable === false) return "Nonrefundable";
  return "Refundability pending";
};

const formatChangeability = (entity: FlightBookableEntity) => {
  const changeable = entity.payload.policy?.changeable;
  if (changeable == null) return null;
  return changeable ? "Changes allowed" : "Changes restricted";
};

const formatBaggage = (entity: FlightBookableEntity) => {
  const count = entity.payload.policy?.checkedBagsIncluded;
  if (count == null) return "Baggage rules unavailable";
  if (count <= 0) return "No checked bag included";
  if (count === 1) return "1 checked bag included";
  return `${count} checked bags included`;
};

const formatSeatsRemaining = (entity: FlightBookableEntity) => {
  const count = entity.payload.policy?.seatsRemaining;
  if (count == null) return null;
  if (count <= 3) return `${count} seats left at this fare`;
  if (count >= 9) return "9+ seats left at this fare";
  return `${count} seats left at this fare`;
};

const buildAirlineLabel = (entity: FlightBookableEntity) => {
  const segments = entity.payload.segments || [];
  const labels = new Set<string>();

  for (const segment of segments) {
    const marketing = toText(segment.marketingCarrier);
    const operating = toText(segment.operatingCarrier);
    if (marketing) labels.add(marketing);
    if (operating) labels.add(operating);
  }

  if (labels.size) {
    return Array.from(labels).join(" / ");
  }

  return toText(entity.title) || "Flight option";
};

const readEntitySegments = (entity: FlightBookableEntity) => {
  const segments = entity.payload.segments;
  if (Array.isArray(segments) && segments.length) {
    return segments;
  }

  return [
    {
      segmentOrder: 0,
      marketingCarrier: toText(entity.provider),
      marketingCarrierCode: toText(entity.bookingContext.carrier),
      operatingCarrier: toText(entity.provider),
      operatingCarrierCode: toText(entity.bookingContext.carrier),
      flightNumber: toText(entity.bookingContext.flightNumber),
      originCode: toText(entity.bookingContext.origin),
      destinationCode: toText(entity.bookingContext.destination),
      departureAt: toText(entity.payload.departureAt),
      arrivalAt: toText(entity.payload.arrivalAt),
      durationMinutes: diffMinutes(entity.payload.departureAt, entity.payload.arrivalAt),
    },
  ];
};

const buildSummaryModel = (
  entity: FlightBookableEntity,
  routeDate: string | null,
): FlightEntitySummaryModel => {
  const segments = readEntitySegments(entity);
  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];
  const departureAirport =
    toText(firstSegment?.originCode) ||
    toText(entity.bookingContext.origin) ||
    "Departure unavailable";
  const arrivalAirport =
    toText(lastSegment?.destinationCode) ||
    toText(entity.bookingContext.destination) ||
    "Arrival unavailable";
  const stopCount = Math.max(0, segments.length - 1);
  const stopAirports = segments
    .slice(0, -1)
    .map((segment) => toText(segment.destinationCode))
    .filter((value): value is string => Boolean(value));
  const durationMinutes =
    diffMinutes(firstSegment?.departureAt, lastSegment?.arrivalAt) ??
    segments.reduce((sum, segment) => sum + (segment.durationMinutes || 0), 0);

  return {
    airlineLabel: buildAirlineLabel(entity),
    providerLabel:
      toText(entity.payload.providerMetadata?.providerName) || toText(entity.provider),
    routeLabel: `${departureAirport} -> ${arrivalAirport}`,
    departureAirportLabel: departureAirport,
    arrivalAirportLabel: arrivalAirport,
    departureTimeLabel: formatDateTimeLabel(firstSegment?.departureAt, routeDate),
    arrivalTimeLabel: formatDateTimeLabel(lastSegment?.arrivalAt),
    durationLabel: formatDurationLabel(durationMinutes || null),
    stopSummary: formatStopSummary(stopCount, stopAirports),
    itineraryTypeLabel: titleCaseToken(
      toText(entity.payload.itineraryType) ||
        toText(entity.payload.providerMetadata?.itineraryType),
    ),
  };
};

const buildSegmentModels = (entity: FlightBookableEntity): FlightEntitySegmentModel[] => {
  const segments = readEntitySegments(entity);

  return segments.map((segment, index) => {
    const next = segments[index + 1];
    const airlineCode = toText(segment.marketingCarrierCode);
    const flightNumber = toText(segment.flightNumber);
    const operatingAirline = toText(segment.operatingCarrier);
    const marketingAirline = toText(segment.marketingCarrier) || operatingAirline;
    const layoverMinutes = next
      ? diffMinutes(segment.arrivalAt, next.departureAt)
      : null;
    const layoverAirport = toText(segment.destinationCode);

    return {
      id: `${entity.inventoryId}:segment:${index + 1}`,
      segmentLabel: `Segment ${(segment.segmentOrder ?? index) + 1}`,
      flightNumberLabel:
        [airlineCode, flightNumber].filter((value): value is string => Boolean(value)).join(" ") ||
        "Flight number unavailable",
      airlineLabel: marketingAirline || "Carrier unavailable",
      operatingAirlineLabel:
        operatingAirline && operatingAirline !== marketingAirline
          ? operatingAirline
          : null,
      aircraftLabel: null,
      departureAirportLabel: toText(segment.originCode) || "Departure unavailable",
      arrivalAirportLabel: toText(segment.destinationCode) || "Arrival unavailable",
      departureTimeLabel: formatDateTimeLabel(segment.departureAt),
      arrivalTimeLabel: formatDateTimeLabel(segment.arrivalAt),
      durationLabel:
        formatDurationLabel(segment.durationMinutes ?? diffMinutes(segment.departureAt, segment.arrivalAt)),
      layoverAfterLabel:
        next && layoverMinutes != null
          ? `Layover ${formatDurationLabel(layoverMinutes)} in ${layoverAirport || "connection airport"}`
          : null,
    };
  });
};

const buildFareSummary = (
  entity: FlightBookableEntity,
  kind: FlightEntityPageUiModel["kind"],
): FlightFareSummaryModel => ({
  cabinClassLabel: titleCaseToken(entity.payload.cabinClass) || "Cabin pending",
  fareCodeLabel: toText(entity.payload.fareCode)?.toUpperCase() || null,
  refundabilityLabel: formatRefundability(entity),
  changeabilityLabel: formatChangeability(entity),
  baggageLabel: formatBaggage(entity),
  totalPriceLabel:
    toText(entity.price.displayText) ||
    formatMoneyFromCents(entity.price.amountCents, entity.price.currency, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }),
  currencyCode: toText(entity.price.currency),
  seatsRemainingLabel: formatSeatsRemaining(entity),
  priceNote:
    kind === "revalidation_required"
      ? "Price shown reflects the live itinerary that resolved during revalidation."
      : kind === "unavailable"
        ? "Shown price comes from the most recent live availability check."
        : "Price will be confirmed again when Add to Trip is enabled.",
});

const buildStatusModel = (
  page: Extract<
    BookableEntityPageLoadResult,
    { kind: "resolved" | "unavailable" | "revalidation_required" }
  >,
): FlightEntityStatusModel => {
  const freshness = buildInventoryFreshness({
    checkedAt: page.resolution.checkedAt,
    profile: "availability_revalidation",
  });
  const match: AvailabilityMatchState =
    page.kind === "revalidation_required" ? "partial" : "exact";
  const availability = buildAvailabilityConfidence({
    freshness,
    match,
    unavailable: page.kind === "unavailable",
    supportText:
      page.kind === "revalidation_required"
        ? "Live inventory resolved to a different canonical itinerary than the one in this URL."
        : page.kind === "unavailable"
          ? "The latest live check shows this itinerary cannot be booked right now."
          : null,
  });

  return {
    availability,
    freshness,
    providerLabel:
      toText(page.entity.payload.providerMetadata?.providerName) ||
      toText(page.entity.provider) ||
      "Provider-agnostic",
    requestedInventoryId:
      page.kind === "revalidation_required"
        ? page.requestedInventoryId
        : page.route.inventoryId,
    resolvedInventoryId:
      page.kind === "revalidation_required" ? page.resolvedInventoryId : null,
    canonicalPath: page.route.canonicalPath,
    checkedAtLabel: formatTimestamp(page.resolution.checkedAt),
  };
};

const buildCtaModel = (
  page: Extract<
    BookableEntityPageLoadResult,
    { kind: "resolved" | "unavailable" | "revalidation_required" }
  >,
) => ({
  label: "Add to Trip",
  disabled: page.kind !== "resolved",
  note:
    page.kind === "revalidation_required"
      ? "Revalidate from search before enabling Add to Trip for the updated itinerary."
      : page.kind === "unavailable"
        ? "This itinerary must become available again before Add to Trip can be enabled."
        : "Adds this itinerary to a persisted trip and opens the updated trip page.",
  inventoryId: page.entity.inventoryId,
  canonicalPath: page.route.canonicalPath,
});

const buildDetailItems = (
  items: Array<[string, string | null | undefined]>,
): FlightEntityDetailItemModel[] =>
  items
    .map(([label, value]) => ({
      label,
      value: toText(value) || "Unavailable",
    }))
    .filter((item) => item.value !== "Unavailable" || item.label === "Route");

const buildUnavailableState = (
  page: BookableEntityPageLoadResult,
): FlightEntityUnavailableStateModel | null => {
  if (page.kind === "unavailable") {
    return {
      badge: "Currently unavailable",
      title: "This itinerary is no longer bookable.",
      description:
        "The canonical flight still resolves, but the latest live check marked it unavailable.",
      tone: "warning",
      primaryAction: {
        label: "Back to flight search",
        href: getBookableEntitySearchHref("flight"),
      },
      secondaryAction: {
        label: "Browse flights",
        href: getBookableEntityBrowseHref("flight"),
      },
      detailItems: buildDetailItems([
        ["Requested inventory ID", page.route.inventoryId],
        ["Route", page.route.canonicalPath],
        ["Last checked", formatTimestamp(page.resolution.checkedAt)],
      ]),
    };
  }

  if (page.kind === "revalidation_required") {
    return {
      badge: "Revalidation needed",
      title: "This URL no longer points to the exact same itinerary.",
      description:
        "Live inventory drifted to a different canonical flight. Review the latest match below, then return to search for a fresh link.",
      tone: "warning",
      primaryAction: {
        label: "Back to flight search",
        href: getBookableEntitySearchHref("flight"),
      },
      secondaryAction: {
        label: "Browse flights",
        href: getBookableEntityBrowseHref("flight"),
      },
      detailItems: buildDetailItems([
        ["Requested inventory ID", page.requestedInventoryId],
        ["Resolved inventory ID", page.resolvedInventoryId],
        ["Route", page.route.canonicalPath],
      ]),
    };
  }

  if (page.kind === "not_found") {
    return {
      badge: "No live match",
      title: "This itinerary could not be resolved.",
      description:
        "The canonical route parsed correctly, but no current flight matched that inventory ID.",
      tone: "critical",
      primaryAction: {
        label: "Back to flight search",
        href: getBookableEntitySearchHref("flight"),
      },
      secondaryAction: {
        label: "Browse flights",
        href: getBookableEntityBrowseHref("flight"),
      },
      detailItems: buildDetailItems([
        ["Requested inventory ID", page.requestedInventoryId],
        ["Route", page.route.canonicalPath],
      ]),
    };
  }

  return null;
};

const buildErrorState = (
  page: BookableEntityPageLoadResult,
): FlightEntityErrorStateModel | null => {
  if (page.kind === "invalid_route") {
    return {
      badge: "Invalid route",
      title: "This flight URL is not canonical.",
      description:
        "Entity detail rendering only works from canonical flight routes generated by the shared TASK-025 routing utilities.",
      primaryAction: {
        label: "Back to flight search",
        href: getBookableEntitySearchHref("flight"),
      },
      secondaryAction: {
        label: "Browse flights",
        href: getBookableEntityBrowseHref("flight"),
      },
      detailItems: buildDetailItems([
        ["Error", page.error.message],
        ["Path", page.error.value || page.pathname],
      ]),
    };
  }

  if (page.kind === "resolution_error") {
    return {
      badge: "Temporary resolution error",
      title: "We couldn't revalidate this flight right now.",
      description:
        "The route is valid, but the live inventory check failed before a normalized entity could be returned.",
      primaryAction: {
        label: "Try again",
        href: page.route.canonicalPath,
      },
      secondaryAction: {
        label: "Back to flight search",
        href: getBookableEntitySearchHref("flight"),
      },
      detailItems: buildDetailItems([
        ["Requested inventory ID", page.requestedInventoryId],
        ["Route", page.route.canonicalPath],
        ["Resolver status", page.message || "Temporary failure"],
      ]),
    };
  }

  return null;
};

const buildHeader = (page: BookableEntityPageLoadResult) => {
  if (page.kind === "invalid_route") {
    return {
      badge: "Invalid route",
      title: "This flight URL is not canonical.",
      description:
        "The canonical entity route parsed before any provider work ran, so malformed flight URLs fail cleanly in one shared place.",
      tone: "critical" as const,
    };
  }

  if (page.kind === "not_found") {
    return {
      badge: "Flight unavailable",
      title: "This itinerary could not be found.",
      description:
        "The route is canonical, but Inventory Resolver could not return a live normalized flight for it.",
      tone: "critical" as const,
    };
  }

  if (page.kind === "resolution_error") {
    return {
      badge: "Temporary error",
      title: "This flight could not be revalidated right now.",
      description:
        "The route is valid, but the live resolver pipeline failed before we could build the detail view.",
      tone: "critical" as const,
    };
  }

  if (page.kind === "unavailable") {
    return {
      badge: "Currently unavailable",
      title: page.entity.title,
      description:
        "The canonical itinerary resolved successfully, but the latest live check says it cannot be booked at the moment.",
      tone: "warning" as const,
    };
  }

  if (page.kind === "revalidation_required") {
    return {
      badge: "Revalidation needed",
      title: page.entity.title,
      description:
        "The requested canonical URL drifted to a different live itinerary. Review the current normalized match below before using it.",
      tone: "warning" as const,
    };
  }

  return {
    badge: "Flight entity",
    title: page.entity.title,
    description:
      "This flight detail page resolves a canonical itinerary through Inventory Resolver and renders provider-agnostic itinerary data.",
    tone: "neutral" as const,
  };
};

const buildBreadcrumbs = (page: BookableEntityPageLoadResult) => {
  const verticalLabel = getBookableEntityVerticalLabel("flight");
  const canonicalPath = page.kind === "invalid_route" ? undefined : page.route.canonicalPath;

  return [
    { label: "Andacity Travel", href: "/" },
    { label: verticalLabel, href: getBookableEntityBrowseHref("flight") },
    { label: "Entity", href: getBookableEntityRouteBase("flight") },
    {
      label:
        page.kind === "resolved"
          ? page.entity.title
          : page.kind === "invalid_route"
            ? "Invalid route"
            : buildHeader(page).badge,
      href: canonicalPath || getBookableEntitySearchHref("flight"),
    },
  ];
};

export const mapFlightEntityPageForUi = (
  page: BookableEntityPageLoadResult,
): FlightEntityPageUiModel => {
  const header = buildHeader(page);
  const errorState = buildErrorState(page);
  const unavailableState = buildUnavailableState(page);

  if (
    page.kind !== "resolved" &&
    page.kind !== "unavailable" &&
    page.kind !== "revalidation_required"
  ) {
    return {
      kind: page.kind,
      breadcrumbs: buildBreadcrumbs(page),
      header,
      summary: null,
      status: null,
      segments: [],
      fareSummary: null,
      cta: null,
      unavailableState,
      errorState,
    };
  }

  const entity = page.entity as FlightBookableEntity;
  const summary = buildSummaryModel(entity, entity.bookingContext.departDate);

  return {
    kind: page.kind,
    breadcrumbs: buildBreadcrumbs(page),
    header,
    summary,
    status: buildStatusModel(page),
    segments: buildSegmentModels(entity),
    fareSummary: buildFareSummary(entity, page.kind),
    cta: buildCtaModel(page),
    unavailableState,
    errorState,
  };
};
