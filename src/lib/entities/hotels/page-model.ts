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
import { computeNights } from "~/lib/search/hotels/dates";
import type { HotelBookableEntity } from "~/types/bookable-entity";
import type { BookableEntityPageLoadResult } from "~/types/bookable-entity-route";
import type {
  HotelAmenitiesListModel,
  HotelEntityCtaModel,
  HotelEntityDetailItemModel,
  HotelEntityErrorStateModel,
  HotelEntityPageUiModel,
  HotelEntityStatusModel,
  HotelEntitySummaryModel,
  HotelEntityUnavailableStateModel,
  HotelOfferSummaryModel,
  HotelPoliciesSummaryModel,
  HotelPriceSummaryModel,
} from "~/types/hotel-entity-page";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const TIMESTAMP_FORMATTER = new Intl.DateTimeFormat("en-US", {
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

const formatTokenLabel = (value: string | null | undefined) => {
  const text = toText(value);
  if (!text) return null;

  return text
    .split(/[-_\s]+/g)
    .filter(Boolean)
    .map((part) => {
      if (part.length <= 2) return part.toUpperCase();
      return `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`;
    })
    .join(" ");
};

const formatIsoDateLabel = (value: string | null | undefined) => {
  const text = toText(value);
  if (!text || !/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text || "Date unavailable";
  }

  const [year, month, day] = text
    .split("-")
    .map((part) => Number.parseInt(part, 10));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) return text;
  return DATE_FORMATTER.format(date);
};

const formatTimestamp = (value: string | null | undefined) => {
  const text = toText(value);
  if (!text) return "Time unavailable";

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return `${TIMESTAMP_FORMATTER.format(date)} UTC`;
};

const buildDateRangeLabel = (
  checkInDate: string | null | undefined,
  checkOutDate: string | null | undefined,
) => {
  const labels = [formatIsoDateLabel(checkInDate), formatIsoDateLabel(checkOutDate)].filter(
    (value): value is string => Boolean(toText(value)),
  );

  if (!labels.length) return "Stay dates unavailable";
  return labels.join(" to ");
};

const buildStayLengthLabel = (nights: number | null | undefined) => {
  const value = typeof nights === "number" ? Math.max(0, Math.round(nights)) : null;
  if (value == null || value <= 0) return null;
  return `${value} night${value === 1 ? "" : "s"}`;
};

const buildOccupancyLabel = (occupancy: number | null | undefined) => {
  const value = typeof occupancy === "number" ? Math.max(0, Math.round(occupancy)) : null;
  if (value == null || value <= 0) return null;
  return `${value} guest${value === 1 ? "" : "s"}`;
};

const buildReviewCountLabel = (reviewCount: number | null | undefined) => {
  const value = typeof reviewCount === "number" ? Math.max(0, Math.round(reviewCount)) : null;
  if (value == null || value <= 0) return null;
  return `${value.toLocaleString("en-US")} reviews`;
};

const formatRefundability = (entity: HotelBookableEntity) => {
  const refundable = entity.payload.policy?.refundable;
  if (refundable === true) return "Refundable";
  if (refundable === false) return "Non-refundable";
  return "Refundability pending";
};

const buildList = (values: Array<string | null | undefined>) => {
  const items: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const text = toText(value);
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(text);
  }

  return items;
};

const buildDetailItems = (
  items: Array<[string, string | null | undefined]>,
): HotelEntityDetailItemModel[] =>
  items
    .map(([label, value]) => ({
      label,
      value: toText(value) || "Unavailable",
    }))
    .filter((item) => item.value !== "Unavailable" || item.label === "Route");

const buildLocationLabel = (entity: HotelBookableEntity) => {
  const property = entity.payload.propertySummary;
  return (
    buildList([property?.neighborhood, property?.cityName]).join(", ") ||
    property?.cityName ||
    property?.neighborhood ||
    "Location unavailable"
  );
};

const buildSummaryModel = (entity: HotelBookableEntity): HotelEntitySummaryModel => {
  const property = entity.payload.propertySummary;
  const room = entity.payload.roomSummary;
  const nights =
    entity.payload.priceSummary?.nights ??
    computeNights(entity.bookingContext.checkInDate, entity.bookingContext.checkOutDate);

  return {
    hotelName: toText(entity.title) || "Hotel option",
    brandLabel: toText(property?.brandName) || toText(entity.provider),
    providerLabel: toText(entity.payload.providerMetadata?.providerName),
    locationLabel: buildLocationLabel(entity),
    addressLabel: toText(property?.addressLine),
    propertyTypeLabel: formatTokenLabel(property?.propertyType),
    starRatingLabel:
      typeof property?.stars === "number" && property.stars > 0
        ? `${property.stars}-star stay`
        : null,
    guestScoreLabel:
      typeof property?.rating === "number" ? `${property.rating.toFixed(1)}/10` : null,
    reviewCountLabel: buildReviewCountLabel(property?.reviewCount),
    stayDateRangeLabel: buildDateRangeLabel(
      entity.bookingContext.checkInDate,
      entity.bookingContext.checkOutDate,
    ),
    stayLengthLabel: buildStayLengthLabel(nights),
    occupancyLabel: buildOccupancyLabel(entity.bookingContext.occupancy),
    roomLabel:
      formatTokenLabel(room?.roomName || entity.bookingContext.roomType) || "Room pending",
    imageUrl: toText(entity.imageUrl),
    summaryText: toText(property?.summary) || toText(entity.subtitle),
  };
};

const buildOfferSummary = (entity: HotelBookableEntity): HotelOfferSummaryModel => {
  const room = entity.payload.roomSummary;
  const includedFeatures = buildList([
    ...(entity.payload.inclusions || []),
    ...(room?.badges || []),
    ...(room?.features || []),
  ]);

  return {
    roomTypeLabel:
      formatTokenLabel(room?.roomName || entity.bookingContext.roomType) || "Room pending",
    ratePlanLabel:
      toText(entity.payload.ratePlan) || formatTokenLabel(entity.payload.ratePlanId),
    boardTypeLabel: formatTokenLabel(entity.payload.boardType),
    bedConfigurationLabel: toText(room?.beds),
    roomSizeLabel:
      typeof room?.sizeSqft === "number" && room.sizeSqft > 0
        ? `${room.sizeSqft.toLocaleString("en-US")} sq ft`
        : null,
    occupancyLabel:
      typeof room?.sleeps === "number" && room.sleeps > 0
        ? `Sleeps up to ${room.sleeps}`
        : buildOccupancyLabel(entity.bookingContext.occupancy),
    cancellationSummary:
      toText(entity.payload.policy?.cancellationLabel) ||
      formatTokenLabel(entity.payload.cancellationPolicy) ||
      formatRefundability(entity),
    includedFeatures,
  };
};

const buildAmenitiesModel = (entity: HotelBookableEntity): HotelAmenitiesListModel => ({
  title: "Amenities and inclusions",
  items: buildList([
    ...(entity.payload.propertySummary?.amenities || []),
    ...(entity.payload.inclusions || []),
  ]),
  emptyLabel: "Amenities are unavailable for this stay.",
});

const buildPoliciesModel = (entity: HotelBookableEntity): HotelPoliciesSummaryModel => ({
  refundabilityLabel: formatRefundability(entity),
  freeCancellationLabel:
    entity.payload.policy?.freeCancellation === true ? "Free cancellation available" : null,
  payLaterLabel:
    entity.payload.policy?.payLater === true
      ? "Pay later available"
      : entity.payload.policy?.payLater === false
        ? "Pay now required"
        : null,
  cancellationLabel: toText(entity.payload.policy?.cancellationLabel),
  checkInLabel: toText(entity.payload.propertySummary?.checkInTime)
    ? `Check-in from ${entity.payload.propertySummary?.checkInTime}`
    : null,
  checkOutLabel: toText(entity.payload.propertySummary?.checkOutTime)
    ? `Check-out by ${entity.payload.propertySummary?.checkOutTime}`
    : null,
  notes: buildList(entity.payload.propertySummary?.notes || []),
});

const buildTaxesFeesLabel = (
  entity: HotelBookableEntity,
  summary = entity.payload.priceSummary,
) => {
  if (!summary) return null;

  const currency = toText(entity.price.currency);
  if (!currency) return null;

  const taxes = summary.taxesCents;
  const fees = summary.mandatoryFeesCents;
  if (taxes == null && fees == null) return null;

  const total = (taxes || 0) + (fees || 0);
  if (total <= 0) return "Taxes and fees included";
  return `${formatMoneyFromCents(total, currency)} taxes and fees`;
};

const buildPriceSummaryModel = (
  entity: HotelBookableEntity,
  kind: HotelEntityPageUiModel["kind"],
): HotelPriceSummaryModel => {
  const summary = entity.payload.priceSummary;
  const totalCents = summary?.totalPriceCents ?? entity.price.amountCents;
  const currency = toText(entity.price.currency);
  const nights =
    summary?.nights ??
    computeNights(entity.bookingContext.checkInDate, entity.bookingContext.checkOutDate);

  return {
    totalPriceLabel:
      totalCents != null && currency
        ? `${formatMoneyFromCents(totalCents, currency, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })} total`
        : toText(entity.price.displayText) || "Price unavailable",
    nightlyPriceLabel:
      summary?.nightlyBaseCents != null && currency
        ? `${formatMoneyFromCents(summary.nightlyBaseCents, currency, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })} / night`
        : null,
    taxesFeesLabel: buildTaxesFeesLabel(entity, summary),
    basePriceLabel:
      summary?.totalBaseCents != null &&
      currency &&
      summary.totalBaseCents !== totalCents
        ? `${formatMoneyFromCents(summary.totalBaseCents, currency)} room rate`
        : null,
    currencyCode: currency,
    stayLengthLabel: buildStayLengthLabel(nights),
    priceNote:
      kind === "revalidation_required"
        ? "Price shown reflects the live stay that resolved during revalidation."
        : kind === "unavailable"
          ? "Shown price comes from the most recent live availability check."
          : "Price will be confirmed again when Add to Trip is enabled.",
  };
};

const buildStatusModel = (
  page: Extract<
    BookableEntityPageLoadResult,
    { kind: "resolved" | "unavailable" | "revalidation_required" }
  >,
): HotelEntityStatusModel => {
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
        ? "Live inventory resolved to a different canonical hotel entity than the one in this URL."
        : page.kind === "unavailable"
          ? "The latest live check shows this stay cannot be booked right now."
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
): HotelEntityCtaModel => ({
  label: "Add to Trip",
  disabled: true,
  note:
    page.kind === "revalidation_required"
      ? "Revalidate from search before enabling Add to Trip for the updated hotel offer."
      : page.kind === "unavailable"
        ? "This stay must become available again before Add to Trip can be enabled."
        : "Booking-session creation and trip-candidate wiring will attach here in the next task.",
  inventoryId: page.entity.inventoryId,
  canonicalPath: page.route.canonicalPath,
});

const buildUnavailableState = (
  page: BookableEntityPageLoadResult,
): HotelEntityUnavailableStateModel | null => {
  if (page.kind === "unavailable") {
    return {
      badge: "Currently unavailable",
      title: "This hotel stay is no longer bookable.",
      description:
        "The canonical hotel entity still resolves, but the latest live check marked it unavailable.",
      tone: "warning",
      primaryAction: {
        label: "Back to hotel search",
        href: getBookableEntitySearchHref("hotel"),
      },
      secondaryAction: {
        label: "Browse hotels",
        href: getBookableEntityBrowseHref("hotel"),
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
      title: "This URL no longer points to the exact same hotel offer.",
      description:
        "Live inventory drifted to a different canonical hotel entity. Review the latest normalized match below, then return to search for a fresh link.",
      tone: "warning",
      primaryAction: {
        label: "Back to hotel search",
        href: getBookableEntitySearchHref("hotel"),
      },
      secondaryAction: {
        label: "Browse hotels",
        href: getBookableEntityBrowseHref("hotel"),
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
      title: "This hotel entity could not be resolved.",
      description:
        "The canonical route parsed correctly, but no current hotel inventory matched that identifier.",
      tone: "critical",
      primaryAction: {
        label: "Back to hotel search",
        href: getBookableEntitySearchHref("hotel"),
      },
      secondaryAction: {
        label: "Browse hotels",
        href: getBookableEntityBrowseHref("hotel"),
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
): HotelEntityErrorStateModel | null => {
  if (page.kind === "invalid_route") {
    return {
      badge: "Invalid route",
      title: "This hotel URL is not canonical.",
      description:
        "Entity detail rendering only works from canonical hotel routes generated by the shared TASK-025 routing utilities.",
      primaryAction: {
        label: "Back to hotel search",
        href: getBookableEntitySearchHref("hotel"),
      },
      secondaryAction: {
        label: "Browse hotels",
        href: getBookableEntityBrowseHref("hotel"),
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
      title: "We couldn't revalidate this hotel right now.",
      description:
        "The route is valid, but the live inventory check failed before a normalized hotel entity could be returned.",
      primaryAction: {
        label: "Try again",
        href: page.route.canonicalPath,
      },
      secondaryAction: {
        label: "Back to hotel search",
        href: getBookableEntitySearchHref("hotel"),
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
      title: "This hotel URL is not canonical.",
      description:
        "The canonical entity route parsed before any provider work ran, so malformed hotel URLs fail cleanly in one shared place.",
      tone: "critical" as const,
    };
  }

  if (page.kind === "not_found") {
    return {
      badge: "Hotel unavailable",
      title: "This stay could not be found.",
      description:
        "The route is canonical, but Inventory Resolver could not return a live normalized hotel entity for it.",
      tone: "critical" as const,
    };
  }

  if (page.kind === "resolution_error") {
    return {
      badge: "Temporary error",
      title: "This hotel could not be revalidated right now.",
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
        "The canonical hotel entity resolved successfully, but the latest live check says it cannot be booked at the moment.",
      tone: "warning" as const,
    };
  }

  if (page.kind === "revalidation_required") {
    return {
      badge: "Revalidation needed",
      title: page.entity.title,
      description:
        "The requested canonical URL drifted to a different live hotel entity. Review the current normalized match below before using it.",
      tone: "warning" as const,
    };
  }

  return {
    badge: "Hotel entity",
    title: page.entity.title,
    description:
      "This hotel detail page resolves a canonical stay through Inventory Resolver and renders provider-agnostic property, offer, policy, and pricing data.",
    tone: "neutral" as const,
  };
};

const buildBreadcrumbs = (page: BookableEntityPageLoadResult) => {
  const verticalLabel = getBookableEntityVerticalLabel("hotel");
  const canonicalPath = page.kind === "invalid_route" ? undefined : page.route.canonicalPath;

  return [
    { label: "Andacity Travel", href: "/" },
    { label: verticalLabel, href: getBookableEntityBrowseHref("hotel") },
    { label: "Entity", href: getBookableEntityRouteBase("hotel") },
    {
      label:
        page.kind === "resolved"
          ? page.entity.title
          : page.kind === "invalid_route"
            ? "Invalid route"
            : buildHeader(page).badge,
      href: canonicalPath || getBookableEntitySearchHref("hotel"),
    },
  ];
};

export const mapHotelEntityPageForUi = (
  page: BookableEntityPageLoadResult,
): HotelEntityPageUiModel => {
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
      offerSummary: null,
      amenities: null,
      policies: null,
      priceSummary: null,
      cta: null,
      unavailableState,
      errorState,
    };
  }

  const entity = page.entity as HotelBookableEntity;

  return {
    kind: page.kind,
    breadcrumbs: buildBreadcrumbs(page),
    header,
    summary: buildSummaryModel(entity),
    status: buildStatusModel(page),
    offerSummary: buildOfferSummary(entity),
    amenities: buildAmenitiesModel(entity),
    policies: buildPoliciesModel(entity),
    priceSummary: buildPriceSummaryModel(entity, page.kind),
    cta: buildCtaModel(page),
    unavailableState,
    errorState,
  };
};
