import {
  buildAvailabilityConfidence,
  type AvailabilityMatchState,
} from "~/lib/inventory/availability-confidence";
import { buildInventoryFreshness } from "~/lib/inventory/freshness";
import {
  getBookableEntityBrowseHref,
  getBookableEntitySearchHref,
  getBookableEntityVerticalLabel,
} from "~/lib/entities/routing";
import { formatMoneyFromCents } from "~/lib/pricing/price-display";
import { computeDays } from "~/lib/search/car-rentals/dates";
import type { CarBookableEntity } from "~/types/bookable-entity";
import type { BookableEntityPageLoadResult } from "~/types/bookable-entity-route";
import type {
  CarEntityCtaModel,
  CarEntityDetailItemModel,
  CarEntityErrorStateModel,
  CarEntityPageUiModel,
  CarEntityStatusModel,
  CarEntitySummaryModel,
  CarEntityUnavailableStateModel,
  CarPickupDropoffSummaryModel,
  CarPriceSummaryModel,
  CarRentalPoliciesModel,
  CarVehicleSpecsModel,
} from "~/types/car-entity-page";

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
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
      if (part.length <= 3) return part.toUpperCase();
      return `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`;
    })
    .join(" ");
};

const parseDateTime = (value: string | null | undefined) => {
  const text = toText(value);
  if (!text) return null;

  const wallClockMatch =
    /^(\d{4})-(\d{2})-(\d{2})[Tt ](\d{2})[:-](\d{2})(?::(\d{2}))?$/.exec(text);
  if (wallClockMatch) {
    const [, yearText, monthText, dayText, hourText, minuteText, secondText] =
      wallClockMatch;
    const date = new Date(
      Date.UTC(
        Number.parseInt(yearText, 10),
        Number.parseInt(monthText, 10) - 1,
        Number.parseInt(dayText, 10),
        Number.parseInt(hourText, 10),
        Number.parseInt(minuteText, 10),
        Number.parseInt(secondText || "0", 10),
      ),
    );

    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateTimeLabel = (value: string | null | undefined) => {
  const date = parseDateTime(value);
  if (!date) return toText(value) || "Time unavailable";
  return DATE_TIME_FORMATTER.format(date);
};

const formatTimestamp = (value: string | null | undefined) => {
  const date = parseDateTime(value);
  if (!date) return toText(value) || "Time unavailable";
  return `${TIMESTAMP_FORMATTER.format(date)} UTC`;
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

const buildRentalLengthLabel = (days: number | null | undefined) => {
  const value =
    typeof days === "number" && Number.isFinite(days)
      ? Math.max(0, Math.round(days))
      : null;
  if (value == null || value <= 0) return null;
  return `${value} day${value === 1 ? "" : "s"}`;
};

const buildPassengerCapacityLabel = (value: number | null | undefined) => {
  if (typeof value !== "number" || value <= 0) return "Passenger capacity unavailable";
  return `${value} passenger${value === 1 ? "" : "s"}`;
};

const buildDoorCountLabel = (value: number | null | undefined) => {
  if (typeof value !== "number" || value <= 0) return null;
  return `${value} door${value === 1 ? "" : "s"}`;
};

const buildLocationTypeLabel = (value: string | null | undefined) => {
  const label = formatTokenLabel(value);
  return label ? `${label} location` : null;
};

const buildRequestedDriverAgeLabel = (value: number | null | undefined) => {
  if (typeof value !== "number" || value <= 0) return null;
  return `Quoted for driver age ${value}`;
};

const buildMinimumDriverAgeLabel = (value: number | null | undefined) => {
  if (typeof value !== "number" || value <= 0) return null;
  return `Minimum driver age ${value}`;
};

const buildTaxesFeesLabel = (entity: CarBookableEntity) => {
  const summary = entity.payload.priceSummary;
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

const readVehicleName = (entity: CarBookableEntity) => {
  const subtitle = toText(entity.subtitle);
  if (subtitle) {
    const [firstSegment] = subtitle
      .split("·")
      .map((segment) => toText(segment))
      .filter((segment): segment is string => Boolean(segment));
    if (firstSegment) return firstSegment;
  }

  return formatTokenLabel(entity.bookingContext.vehicleClass) || "Vehicle option";
};

const readRentalCompanyLabel = (entity: CarBookableEntity) =>
  toText(entity.payload.providerMetadata?.rentalCompany) ||
  toText(entity.title) ||
  toText(entity.provider);

const readRatePlanLabel = (entity: CarBookableEntity) =>
  toText(entity.payload.providerMetadata?.ratePlan) ||
  toText(entity.payload.ratePlan) ||
  formatTokenLabel(entity.payload.providerMetadata?.ratePlanCode) ||
  formatTokenLabel(entity.payload.ratePlanCode);

const readFuelPolicy = (entity: CarBookableEntity) =>
  toText(entity.payload.providerMetadata?.fuelPolicy) || toText(entity.payload.fuelPolicy);

const readMileagePolicy = (entity: CarBookableEntity) =>
  toText(entity.payload.providerMetadata?.mileagePolicy) ||
  toText(entity.payload.mileagePolicy);

const readPickupLocationLabel = (entity: CarBookableEntity) =>
  toText(entity.payload.providerMetadata?.pickupLocationName) ||
  toText(entity.payload.pickupLocationName) ||
  "Pickup location unavailable";

const readDropoffLocationLabel = (entity: CarBookableEntity) =>
  toText(entity.payload.providerMetadata?.dropoffLocationName) ||
  toText(entity.payload.dropoffLocationName) ||
  "Dropoff location unavailable";

const buildEntityHeading = (entity: CarBookableEntity) => {
  const vehicleName = readVehicleName(entity);
  const rentalCompany = readRentalCompanyLabel(entity);

  if (rentalCompany && vehicleName && rentalCompany.toLowerCase() !== vehicleName.toLowerCase()) {
    return `${vehicleName} from ${rentalCompany}`;
  }

  return vehicleName || rentalCompany || "Car rental";
};

const buildSummaryModel = (entity: CarBookableEntity): CarEntitySummaryModel => {
  const rentalDays =
    entity.payload.priceSummary?.days ??
    computeDays(
      entity.bookingContext.pickupDateTime?.slice(0, 10) || null,
      entity.bookingContext.dropoffDateTime?.slice(0, 10) || null,
    );
  const summaryHighlights = buildList([
    readRatePlanLabel(entity),
    entity.payload.policy?.cancellationLabel || null,
    ...((entity.payload.badges || []).map((entry) => String(entry))),
  ]);

  return {
    vehicleName: readVehicleName(entity),
    categoryLabel: formatTokenLabel(entity.bookingContext.vehicleClass) || "Category pending",
    rentalCompanyLabel: readRentalCompanyLabel(entity),
    providerLabel:
      toText(entity.payload.providerMetadata?.providerName) || toText(entity.provider),
    pickupLocationLabel: readPickupLocationLabel(entity),
    dropoffLocationLabel: readDropoffLocationLabel(entity),
    pickupDateTimeLabel: formatDateTimeLabel(entity.bookingContext.pickupDateTime),
    dropoffDateTimeLabel: formatDateTimeLabel(entity.bookingContext.dropoffDateTime),
    rentalLengthLabel: buildRentalLengthLabel(rentalDays),
    ratePlanLabel: readRatePlanLabel(entity),
    imageUrl: toText(entity.imageUrl),
    summaryText: summaryHighlights.length ? summaryHighlights.join(" · ") : null,
  };
};

const buildVehicleSpecsModel = (entity: CarBookableEntity): CarVehicleSpecsModel => ({
  vehicleClassLabel:
    formatTokenLabel(entity.bookingContext.vehicleClass) || "Vehicle class unavailable",
  transmissionLabel:
    formatTokenLabel(entity.payload.transmissionType) || "Transmission unavailable",
  passengerCapacityLabel: buildPassengerCapacityLabel(entity.payload.seatingCapacity),
  baggageCapacityLabel:
    toText(entity.payload.luggageCapacity) || "Baggage capacity unavailable",
  doorCountLabel: buildDoorCountLabel(entity.payload.doors),
  airConditioningLabel:
    entity.payload.airConditioning === true
      ? "Air conditioning included"
      : entity.payload.airConditioning === false
        ? "No air conditioning"
        : null,
  fuelPolicyLabel: readFuelPolicy(entity),
  mileagePolicyLabel: readMileagePolicy(entity),
  ratePlanLabel: readRatePlanLabel(entity),
  highlights: buildList([
    ...((entity.payload.badges || []).map((entry) => String(entry))),
    ...((entity.payload.features || []).map((entry) => String(entry))),
  ]),
});

const buildPoliciesModel = (entity: CarBookableEntity): CarRentalPoliciesModel => ({
  cancellationSummary:
    entity.payload.policy?.freeCancellation === true
      ? "Free cancellation"
      : entity.payload.policy?.freeCancellation === false
        ? "Cancellation policy applies"
        : toText(entity.payload.policy?.cancellationLabel) || "Cancellation terms unavailable",
  paymentLabel:
    toText(entity.payload.policy?.paymentLabel) ||
    (entity.payload.policy?.payAtCounter === true
      ? "Pay at counter"
      : entity.payload.policy?.payAtCounter === false
        ? "Prepayment may be required"
        : null),
  depositLabel:
    toText(entity.payload.policy?.depositLabel) ||
    (entity.payload.policy?.securityDepositRequired === true
      ? "Security deposit required"
      : entity.payload.policy?.securityDepositRequired === false
        ? "No security deposit required"
        : null),
  minimumDriverAgeLabel: buildMinimumDriverAgeLabel(entity.payload.policy?.minDriverAge),
  quotedDriverAgeLabel: buildRequestedDriverAgeLabel(
    entity.payload.providerMetadata?.driverAge,
  ),
  feesLabel: toText(entity.payload.policy?.feesLabel),
  notes: buildList([
    ...((entity.payload.inclusions || []).map((entry) => String(entry))),
    ...((entity.payload.badges || []).map((entry) => String(entry))),
    ...((entity.payload.features || []).map((entry) => String(entry))),
  ]),
});

const buildPickupDropoffModel = (
  entity: CarBookableEntity,
): CarPickupDropoffSummaryModel => {
  const rentalDays =
    entity.payload.priceSummary?.days ??
    computeDays(
      entity.bookingContext.pickupDateTime?.slice(0, 10) || null,
      entity.bookingContext.dropoffDateTime?.slice(0, 10) || null,
    );

  return {
    pickupLocationLabel: readPickupLocationLabel(entity),
    pickupTypeLabel: buildLocationTypeLabel(
      entity.payload.providerMetadata?.pickupLocationType || entity.payload.pickupLocationType,
    ),
    pickupAddressLabel:
      toText(entity.payload.providerMetadata?.pickupAddressLine) ||
      toText(entity.payload.pickupAddressLine),
    pickupDateTimeLabel: formatDateTimeLabel(entity.bookingContext.pickupDateTime),
    dropoffLocationLabel: readDropoffLocationLabel(entity),
    dropoffTypeLabel: buildLocationTypeLabel(
      entity.payload.providerMetadata?.dropoffLocationType || entity.payload.dropoffLocationType,
    ),
    dropoffAddressLabel:
      toText(entity.payload.providerMetadata?.dropoffAddressLine) ||
      toText(entity.payload.dropoffAddressLine),
    dropoffDateTimeLabel: formatDateTimeLabel(entity.bookingContext.dropoffDateTime),
    rentalLengthLabel: buildRentalLengthLabel(rentalDays),
  };
};

const buildPriceSummaryModel = (
  entity: CarBookableEntity,
  kind: CarEntityPageUiModel["kind"],
): CarPriceSummaryModel => {
  const summary = entity.payload.priceSummary;
  const currency = toText(entity.price.currency);
  const rentalDays =
    summary?.days ??
    computeDays(
      entity.bookingContext.pickupDateTime?.slice(0, 10) || null,
      entity.bookingContext.dropoffDateTime?.slice(0, 10) || null,
    );
  const totalBaseCents =
    summary?.totalBaseCents ??
    (summary?.dailyBaseCents != null && rentalDays != null
      ? summary.dailyBaseCents * rentalDays
      : null);
  const totalPriceCents = summary?.totalPriceCents ?? totalBaseCents;
  const dailyBaseCents = summary?.dailyBaseCents ?? entity.price.amountCents;

  return {
    totalPriceLabel:
      totalPriceCents != null && currency
        ? `${formatMoneyFromCents(totalPriceCents, currency)} total`
        : toText(entity.price.displayText) ||
          (dailyBaseCents != null && currency
            ? `${formatMoneyFromCents(dailyBaseCents, currency)} / day`
            : "Price unavailable"),
    dailyPriceLabel:
      dailyBaseCents != null && currency
        ? `${formatMoneyFromCents(dailyBaseCents, currency)} / day`
        : null,
    taxesFeesLabel: buildTaxesFeesLabel(entity),
    basePriceLabel:
      totalBaseCents != null &&
      currency &&
      (totalPriceCents == null || totalBaseCents !== totalPriceCents)
        ? `${formatMoneyFromCents(totalBaseCents, currency)} base rental`
        : null,
    currencyCode: currency,
    rentalLengthLabel: buildRentalLengthLabel(rentalDays),
    priceNote:
      kind === "revalidation_required"
        ? "Price shown reflects the live car rental that resolved during revalidation."
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
): CarEntityStatusModel => {
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
        ? "Live inventory resolved to a different canonical car entity than the one in this URL."
        : page.kind === "unavailable"
          ? "The latest live check shows this rental cannot be booked right now."
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
): CarEntityCtaModel => ({
  label: "Add to Trip",
  disabled: page.kind !== "resolved",
  note:
    page.kind === "revalidation_required"
      ? "Revalidate from search before enabling Add to Trip for the updated car rental."
      : page.kind === "unavailable"
        ? "This rental must become available again before Add to Trip can be enabled."
        : "Adds this rental to a persisted trip and opens the updated trip page.",
  inventoryId: page.entity.inventoryId,
  canonicalPath: page.route.canonicalPath,
});

const buildDetailItems = (
  items: Array<[string, string | null | undefined]>,
): CarEntityDetailItemModel[] =>
  items
    .map(([label, value]) => ({
      label,
      value: toText(value) || "Unavailable",
    }))
    .filter((item) => item.value !== "Unavailable" || item.label === "Route");

const buildUnavailableState = (
  page: BookableEntityPageLoadResult,
): CarEntityUnavailableStateModel | null => {
  if (page.kind === "unavailable") {
    return {
      badge: "Currently unavailable",
      title: "This car rental is no longer bookable.",
      description:
        "The canonical car entity still resolves, but the latest live check marked it unavailable.",
      tone: "warning",
      primaryAction: {
        label: "Back to car search",
        href: getBookableEntitySearchHref("car"),
      },
      secondaryAction: {
        label: "Browse cars",
        href: getBookableEntityBrowseHref("car"),
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
      title: "This URL no longer points to the exact same car rental.",
      description:
        "Live inventory drifted to a different canonical car entity. Review the latest normalized match below, then return to search for a fresh link.",
      tone: "warning",
      primaryAction: {
        label: "Back to car search",
        href: getBookableEntitySearchHref("car"),
      },
      secondaryAction: {
        label: "Browse cars",
        href: getBookableEntityBrowseHref("car"),
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
      title: "This car rental could not be resolved.",
      description:
        "The canonical route parsed correctly, but no current car inventory matched that identifier.",
      tone: "critical",
      primaryAction: {
        label: "Back to car search",
        href: getBookableEntitySearchHref("car"),
      },
      secondaryAction: {
        label: "Browse cars",
        href: getBookableEntityBrowseHref("car"),
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
): CarEntityErrorStateModel | null => {
  if (page.kind === "invalid_route") {
    return {
      badge: "Invalid route",
      title: "This car rental URL is not canonical.",
      description:
        "Entity detail rendering only works from canonical car routes generated by the shared routing utilities.",
      primaryAction: {
        label: "Back to car search",
        href: getBookableEntitySearchHref("car"),
      },
      secondaryAction: {
        label: "Browse cars",
        href: getBookableEntityBrowseHref("car"),
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
      title: "We couldn't revalidate this car rental right now.",
      description:
        "The route is valid, but the live inventory check failed before a normalized car entity could be returned.",
      primaryAction: {
        label: "Try again",
        href: page.route.canonicalPath,
      },
      secondaryAction: {
        label: "Back to car search",
        href: getBookableEntitySearchHref("car"),
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
      title: "This car rental URL is not canonical.",
      description:
        "The canonical entity route parsed before any provider work ran, so malformed car URLs fail cleanly in one shared place.",
      tone: "critical" as const,
    };
  }

  if (page.kind === "not_found") {
    return {
      badge: "Car unavailable",
      title: "This rental could not be found.",
      description:
        "The route is canonical, but Inventory Resolver could not return a live normalized car entity for it.",
      tone: "critical" as const,
    };
  }

  if (page.kind === "resolution_error") {
    return {
      badge: "Temporary error",
      title: "This car rental could not be revalidated right now.",
      description:
        "The route is valid, but the live resolver pipeline failed before we could build the detail view.",
      tone: "critical" as const,
    };
  }

  if (page.kind === "unavailable") {
    return {
      badge: "Currently unavailable",
      title: buildEntityHeading(page.entity as CarBookableEntity),
      description:
        "The canonical car entity resolved successfully, but the latest live check says it cannot be booked at the moment.",
      tone: "warning" as const,
    };
  }

  if (page.kind === "revalidation_required") {
    return {
      badge: "Revalidation needed",
      title: buildEntityHeading(page.entity as CarBookableEntity),
      description:
        "The requested canonical URL drifted to a different live car entity. Review the current normalized match below before using it.",
      tone: "warning" as const,
    };
  }

  return {
    badge: "Car entity",
    title: buildEntityHeading(page.entity as CarBookableEntity),
    description:
      "This car detail page resolves a canonical rental through Inventory Resolver and renders provider-agnostic vehicle, pickup, policy, and pricing data.",
    tone: "neutral" as const,
  };
};

const buildBreadcrumbs = (page: BookableEntityPageLoadResult) => {
  const verticalLabel = getBookableEntityVerticalLabel("car");
  const canonicalPath = page.kind === "invalid_route" ? undefined : page.route.canonicalPath;

  return [
    { label: "Andacity Travel", href: "/" },
    { label: verticalLabel, href: getBookableEntityBrowseHref("car") },
    { label: "Search", href: getBookableEntitySearchHref("car") },
    {
      label:
        page.kind === "resolved"
          ? buildEntityHeading(page.entity as CarBookableEntity)
          : page.kind === "invalid_route"
            ? "Invalid route"
            : buildHeader(page).badge,
      href: canonicalPath || getBookableEntitySearchHref("car"),
    },
  ];
};

export const mapCarEntityPageForUi = (
  page: BookableEntityPageLoadResult,
): CarEntityPageUiModel => {
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
      vehicleSpecs: null,
      policies: null,
      pickupDropoff: null,
      priceSummary: null,
      cta: null,
      unavailableState,
      errorState,
    };
  }

  const entity = page.entity as CarBookableEntity;

  return {
    kind: page.kind,
    breadcrumbs: buildBreadcrumbs(page),
    header,
    summary: buildSummaryModel(entity),
    status: buildStatusModel(page),
    vehicleSpecs: buildVehicleSpecsModel(entity),
    policies: buildPoliciesModel(entity),
    pickupDropoff: buildPickupDropoffModel(entity),
    priceSummary: buildPriceSummaryModel(entity, page.kind),
    cta: buildCtaModel(page),
    unavailableState,
    errorState,
  };
};
