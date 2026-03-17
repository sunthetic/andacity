import { buildCarEntityHref } from "~/lib/entities/routing";
import { formatMoneyFromCents, toAmountFromCents } from "~/lib/pricing/price-display";
import { computeDays } from "~/lib/search/car-rentals/dates";
import type { CarSearchRequest, SearchResultsApiMetadata } from "~/types/search";
import type { CarSearchEntity } from "~/types/search-entity";
import type {
  CarResultCardModel,
  CarResultsPageUiModel,
  CarSearchSummaryModel,
} from "~/types/search-ui";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
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

const formatIsoDateLabel = (value: string | null | undefined) => {
  const date = parseIsoDate(value);
  if (!date) return toText(value) || "Date unavailable";
  return DATE_FORMATTER.format(date);
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

const buildRentalLengthLabel = (days: number | null) => {
  if (days == null) return "Rental length unavailable";
  return `${days} day${days === 1 ? "" : "s"}`;
};

const buildVehicleName = (result: CarSearchEntity) => {
  const subtitle = toText(result.subtitle);
  if (subtitle) {
    const [firstSegment] = subtitle.split("·");
    const vehicleName = toText(firstSegment);
    if (vehicleName) return vehicleName;
  }

  return (
    formatTokenLabel(result.payload.vehicleClass ?? result.metadata.vehicleClass) ||
    toText(result.title) ||
    "Car option"
  );
};

const buildCategoryLabel = (result: CarSearchEntity) =>
  formatTokenLabel(result.payload.vehicleClass ?? result.metadata.vehicleClass) || "Category unavailable";

const buildBrandLabel = (result: CarSearchEntity) =>
  toText(result.title) || toText(result.provider) || "Rental company unavailable";

const buildTransmissionLabel = (result: CarSearchEntity) =>
  formatTokenLabel(result.payload.transmissionType ?? result.metadata.transmission) || "Transmission unavailable";

const buildPassengerLabel = (result: CarSearchEntity) => {
  const seats = result.payload.seatingCapacity ?? result.metadata.seats;
  return typeof seats === "number" && seats > 0
    ? `${seats} passenger${seats === 1 ? "" : "s"}`
    : "Passenger capacity unavailable";
};

const buildBaggageLabel = (result: CarSearchEntity) =>
  toText(result.payload.luggageCapacity ?? result.metadata.luggageCapacity) || "Baggage capacity unavailable";

const buildCancellationSummary = (result: CarSearchEntity) => {
  if (result.payload.policy?.freeCancellation === true) {
    return "Free cancellation";
  }

  if (result.payload.policy?.freeCancellation === false) {
    return "Cancellation policy applies";
  }

  return toText(result.payload.policy?.cancellationLabel) || "Cancellation terms unavailable";
};

const buildPriceModel = (result: CarSearchEntity) => {
  const priceSummary = result.payload.priceSummary;
  const currency = toText(result.price.currency);
  const totalCents = priceSummary?.totalPriceCents ?? null;
  const dailyCents = priceSummary?.dailyBaseCents ?? result.price.amountCents ?? null;
  const displayText = toText(result.price.displayText);
  const dailyDisplay =
    dailyCents != null && currency
      ? `${formatMoneyFromCents(dailyCents, currency, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })} / day`
      : null;

  if (totalCents != null && currency) {
    return {
      totalAmount: toAmountFromCents(totalCents),
      dailyAmount: toAmountFromCents(dailyCents),
      currency,
      totalDisplay: `${formatMoneyFromCents(totalCents, currency, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })} total`,
      supportingDisplay: dailyDisplay ? `${dailyDisplay} base rate` : `${currency} total`,
    };
  }

  if (displayText) {
    return {
      totalAmount: toAmountFromCents(totalCents),
      dailyAmount: toAmountFromCents(dailyCents),
      currency,
      totalDisplay: displayText,
      supportingDisplay: dailyDisplay || (currency ? `${currency} pricing updates at selection` : "Pricing updates at selection"),
    };
  }

  if (dailyDisplay) {
    return {
      totalAmount: toAmountFromCents(totalCents),
      dailyAmount: toAmountFromCents(dailyCents),
      currency,
      totalDisplay: dailyDisplay,
      supportingDisplay: "Total updates at selection",
    };
  }

  return {
    totalAmount: toAmountFromCents(totalCents),
    dailyAmount: toAmountFromCents(dailyCents),
    currency,
    totalDisplay: "Price unavailable",
    supportingDisplay: currency ? `${currency} pricing updates at selection` : "Pricing updates at selection",
  };
};

export const mapCarSearchSummaryForUi = (
  request: CarSearchRequest,
  metadata: SearchResultsApiMetadata,
): CarSearchSummaryModel => {
  const rentalLengthDays = computeDays(request.pickupDate, request.dropoffDate);
  const sourceLabel = metadata.cacheHit ? "Cached results" : "Fresh provider results";
  const providerLabel = metadata.providersQueried.length
    ? `Source: ${metadata.providersQueried.join(", ")}`
    : null;

  return {
    searchTitle: `${request.airport} airport car rentals`,
    pickupCode: request.airport,
    dropoffCode: request.airport,
    pickupDateLabel: formatIsoDateLabel(request.pickupDate),
    dropoffDateLabel: formatIsoDateLabel(request.dropoffDate),
    rentalLengthDays,
    rentalLengthLabel: buildRentalLengthLabel(rentalLengthDays),
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

export const mapCarResultCardForUi = (
  result: CarSearchEntity,
  request: CarSearchRequest,
): CarResultCardModel => {
  const detailHref = toText(result.href) || buildCarEntityHref(result);

  return {
    id: result.inventoryId,
    vehicleName: buildVehicleName(result),
    categoryLabel: buildCategoryLabel(result),
    brandLabel: buildBrandLabel(result),
    providerLabel: toText(result.payload.providerMetadata?.providerName),
    pickupCode: request.airport,
    dropoffCode: request.airport,
    pickupDateLabel: formatIsoDateLabel(request.pickupDate),
    dropoffDateLabel: formatIsoDateLabel(request.dropoffDate),
    rentalLengthLabel: buildRentalLengthLabel(computeDays(request.pickupDate, request.dropoffDate)),
    transmissionLabel: buildTransmissionLabel(result),
    passengerLabel: buildPassengerLabel(result),
    baggageLabel: buildBaggageLabel(result),
    cancellationSummary: buildCancellationSummary(result),
    price: buildPriceModel(result),
    ctaLabel: "View rental",
    ctaHref: detailHref,
    ctaDisabled: false,
  };
};

export const mapCarResultsForUi = (input: {
  request: CarSearchRequest;
  results: CarSearchEntity[];
  metadata: SearchResultsApiMetadata;
}): CarResultsPageUiModel => ({
  summary: mapCarSearchSummaryForUi(input.request, input.metadata),
  cards: input.results.map((result) =>
    mapCarResultCardForUi(result, input.request),
  ),
});
