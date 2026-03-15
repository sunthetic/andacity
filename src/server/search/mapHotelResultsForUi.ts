import { formatMoneyFromCents, toAmountFromCents } from "~/lib/pricing/price-display";
import { computeNights } from "~/lib/search/hotels/dates";
import type { HotelSearchRequest, SearchResultsApiMetadata } from "~/types/search";
import type { HotelSearchEntity } from "~/types/search-entity";
import type {
  HotelResultCardModel,
  HotelResultsPageUiModel,
  HotelSearchSummaryModel,
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
      if (part.length <= 2) return part.toUpperCase();
      return `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`;
    })
    .join(" ");
};

const formatCityLabelFromSlug = (citySlug: string) => {
  const tokens = citySlug
    .split("-")
    .map((token) => token.trim())
    .filter(Boolean);

  if (!tokens.length) return citySlug;
  if (tokens.length <= 2) {
    return tokens
      .map((token) => (token.length <= 2 ? token.toUpperCase() : formatTokenLabel(token)))
      .join(", ");
  }

  const countryCode = tokens[tokens.length - 1]?.toUpperCase() || null;
  const regionCode = tokens[tokens.length - 2]?.toUpperCase() || null;
  const cityTokens = tokens.slice(0, -2);
  const cityName = cityTokens
    .map((token) => formatTokenLabel(token) || token)
    .join(" ")
    .trim();

  return [cityName || null, regionCode, countryCode].filter((value): value is string => Boolean(value)).join(", ");
};

const resolveCityLabel = (request: HotelSearchRequest, results: HotelSearchEntity[]) => {
  const cityName = results
    .map((result) => toText(result.metadata.cityName))
    .find((value): value is string => Boolean(value));

  if (!cityName) {
    return formatCityLabelFromSlug(request.city);
  }

  const slugLabel = formatCityLabelFromSlug(request.city);
  const slugSuffix = slugLabel.startsWith(`${cityName}, `) ? slugLabel.slice(cityName.length + 2) : null;
  return slugSuffix ? `${cityName}, ${slugSuffix}` : cityName;
};

const buildStayLengthLabel = (nights: number | null) => {
  if (nights == null) return "Stay length unavailable";
  return `${nights} night${nights === 1 ? "" : "s"}`;
};

const buildOfferSummary = (result: HotelSearchEntity) => {
  const roomType = formatTokenLabel(result.payload.roomType ?? result.metadata.roomType);
  const ratePlan = toText(result.payload.ratePlan ?? result.metadata.ratePlan);
  const boardType = formatTokenLabel(result.payload.boardType ?? result.metadata.boardType);
  const parts = [roomType, ratePlan, boardType].filter((value): value is string => Boolean(value));
  return parts.length ? parts.join(" · ") : null;
};

const buildCancellationSummary = (result: HotelSearchEntity) => {
  if (result.payload.policy?.freeCancellation) return "Free cancellation";
  if (result.payload.policy?.cancellationLabel) return result.payload.policy.cancellationLabel;
  return formatTokenLabel(result.payload.cancellationPolicy ?? result.metadata.cancellationPolicy);
};

const buildPolicySummary = (result: HotelSearchEntity) => {
  const parts = [
    result.payload.policy?.payLater ? "Pay later available" : null,
    result.payload.policy?.refundable === true ? "Refundable" : null,
    result.payload.policy?.refundable === false ? "Non-refundable" : null,
  ].filter((value): value is string => Boolean(value));

  return parts.length ? parts.join(" · ") : null;
};

const buildPriceModel = (result: HotelSearchEntity) => {
  const priceSummary = result.payload.priceSummary;
  const currency = toText(result.price.currency);
  const totalCents = priceSummary?.totalPriceCents ?? result.price.amountCents;
  const nightlyCents = priceSummary?.nightlyBaseCents ?? null;
  const displayText = toText(result.price.displayText);

  const totalDisplay =
    totalCents != null && currency
      ? `${formatMoneyFromCents(totalCents, currency, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })} total`
      : displayText
        ? displayText
      : "Price unavailable";

  const nightlyDisplay =
    nightlyCents != null && currency
      ? `${formatMoneyFromCents(nightlyCents, currency, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })} / night`
      : null;

  return {
    totalAmount: toAmountFromCents(totalCents),
    nightlyAmount: toAmountFromCents(nightlyCents),
    currency,
    totalDisplay,
    nightlyDisplay,
  };
};

const buildDetailHref = (result: HotelSearchEntity) => {
  if (toText(result.href)) return result.href;
  const hotelSlug = toText(result.payload.hotelSlug);
  return hotelSlug ? `/hotels/${encodeURIComponent(hotelSlug)}` : null;
};

export const mapHotelSearchSummaryForUi = (
  request: HotelSearchRequest,
  results: HotelSearchEntity[],
  metadata: SearchResultsApiMetadata,
): HotelSearchSummaryModel => {
  const stayLengthNights = computeNights(request.checkIn, request.checkOut);
  const sourceLabel = metadata.cacheHit ? "Cached results" : "Fresh provider results";
  const providerLabel = metadata.providersQueried.length
    ? `Source: ${metadata.providersQueried.join(", ")}`
    : null;

  return {
    cityLabel: resolveCityLabel(request, results),
    checkInDateLabel: formatIsoDateLabel(request.checkIn),
    checkOutDateLabel: formatIsoDateLabel(request.checkOut),
    stayLengthNights,
    stayLengthLabel: buildStayLengthLabel(stayLengthNights),
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

export const mapHotelResultCardForUi = (
  result: HotelSearchEntity,
  cityLabel: string,
): HotelResultCardModel => {
  const detailHref = buildDetailHref(result);

  return {
    id: result.inventoryId,
    hotelName: toText(result.title) || "Hotel option",
    cityLabel: toText(result.metadata.cityName) || cityLabel,
    areaLabel: toText(result.metadata.neighborhood),
    starRating: result.metadata.stars ?? null,
    guestScore: result.metadata.rating ?? null,
    reviewCount: result.metadata.reviewCount ?? null,
    offerSummary: buildOfferSummary(result),
    amenitiesSummary: Array.isArray(result.payload.inclusions)
      ? result.payload.inclusions
          .map((entry) => toText(entry))
          .filter((value): value is string => Boolean(value))
          .slice(0, 3)
      : [],
    cancellationSummary: buildCancellationSummary(result),
    policySummary: buildPolicySummary(result),
    price: buildPriceModel(result),
    imageUrl: toText(result.imageUrl),
    detailHref,
    ctaLabel: "View details",
    ctaHref: detailHref,
    ctaDisabled: !detailHref,
  };
};

export const mapHotelResultsForUi = (input: {
  request: HotelSearchRequest;
  results: HotelSearchEntity[];
  metadata: SearchResultsApiMetadata;
}): HotelResultsPageUiModel => {
  const summary = mapHotelSearchSummaryForUi(input.request, input.results, input.metadata);

  return {
    summary,
    cards: input.results.map((result) => mapHotelResultCardForUi(result, summary.cityLabel)),
  };
};
