import { buildBookableEntityPath } from "~/lib/entities/routing";
import {
  buildPriceDisplayFromMetadata,
  formatMoney,
  formatMoneyFromCents,
  formatPriceQualifier,
  formatUnitCountLabel,
} from "~/lib/pricing/price-display";
import { computeDays } from "~/lib/search/car-rentals/dates";
import { computeNights } from "~/lib/search/hotels/dates";
import type {
  BookableEntity,
  CarBookableEntity,
  FlightBookableEntity,
  HotelBookableEntity,
} from "~/types/bookable-entity";
import type { TripDetails, TripItem, TripItemType } from "~/types/trips/trip";

export const TRIP_PAGE_GROUP_ORDER = ["flight", "hotel", "car"] as const;

export type TripPageActionSlot = {
  id: "remove_item" | "revalidate_trip" | "add_more_items";
  label: string;
  description: string;
};

export type TripPageSummaryModel = {
  tripId: number;
  reference: string;
  name: string;
  statusLabel: string;
  totalItemCount: number;
  itemCounts: Record<TripItemType, number>;
  savedTotalLabel: string;
  savedTotalContext: string;
  updatedLabel: string;
  dateRangeLabel: string | null;
  citiesLabel: string | null;
  bookingSessionLabel: string | null;
  continueHref: string;
  futureActions: TripPageActionSlot[];
};

type TripPageItemBase = {
  id: number;
  itemType: TripItemType;
  title: string;
  subtitle: string | null;
  meta: string[];
  priceLabel: string;
  priceContext: string;
  addedLabel: string;
  viewHref: string | null;
  removeAction: TripPageActionSlot;
};

export type TripPageFlightItemModel = TripPageItemBase & {
  itemType: "flight";
  routeSummary: string;
  airlineSummary: string | null;
  departureLabel: string | null;
  arrivalLabel: string | null;
  itineraryLabel: string | null;
};

export type TripPageHotelItemModel = TripPageItemBase & {
  itemType: "hotel";
  locationLabel: string;
  stayLabel: string;
  roomSummary: string | null;
};

export type TripPageCarItemModel = TripPageItemBase & {
  itemType: "car";
  locationLabel: string;
  rentalLabel: string;
  vehicleSummary: string | null;
  providerSummary: string | null;
};

export type TripPageItemGroupModel =
  | {
      itemType: "flight";
      title: string;
      description: string;
      count: number;
      items: TripPageFlightItemModel[];
    }
  | {
      itemType: "hotel";
      title: string;
      description: string;
      count: number;
      items: TripPageHotelItemModel[];
    }
  | {
      itemType: "car";
      title: string;
      description: string;
      count: number;
      items: TripPageCarItemModel[];
    };

export type TripPageModel = {
  tripId: number;
  summary: TripPageSummaryModel;
  groups: TripPageItemGroupModel[];
  isEmpty: boolean;
};

const FUTURE_ACTIONS: TripPageActionSlot[] = [
  {
    id: "revalidate_trip",
    label: "Revalidate trip",
    description: "Check every saved item against the latest available inventory.",
  },
  {
    id: "add_more_items",
    label: "Add more items",
    description: "Return to search and keep building this itinerary.",
  },
];

const REMOVE_ACTION: TripPageActionSlot = {
  id: "remove_item",
  label: "Remove item",
  description: "Remove this saved item from the trip.",
};

export const mapTripDetailsToTripPageModel = (trip: TripDetails): TripPageModel => {
  const itemCounts: Record<TripItemType, number> = {
    flight: 0,
    hotel: 0,
    car: 0,
  };

  for (const item of trip.items) {
    itemCounts[item.itemType] += 1;
  }

  const groups: TripPageItemGroupModel[] = [];
  for (const itemType of TRIP_PAGE_GROUP_ORDER) {
    const items = trip.items.filter((item) => item.itemType === itemType);
    if (!items.length) continue;

    if (itemType === "flight") {
      groups.push({
        itemType,
        title: "Flights",
        description: "Persisted air legs saved into this trip.",
        count: items.length,
        items: items.map((item) => toFlightItemModel(item)),
      });
      continue;
    }

    if (itemType === "hotel") {
      groups.push({
        itemType,
        title: "Hotels",
        description: "Saved stays rendered from canonical trip snapshots.",
        count: items.length,
        items: items.map((item) => toHotelItemModel(item)),
      });
      continue;
    }

    groups.push({
      itemType,
      title: "Cars",
      description: "Saved ground transport inventory grouped for the trip.",
      count: items.length,
      items: items.map((item) => toCarItemModel(item)),
    });
  }

  return {
    tripId: trip.id,
    summary: {
      tripId: trip.id,
      reference: buildTripReference(trip.id),
      name: trip.name,
      statusLabel: toTitleCase(trip.status),
      totalItemCount: trip.items.length,
      itemCounts,
      savedTotalLabel: formatSavedTotal(trip),
      savedTotalContext: trip.pricing.hasPartialPricing
        ? "Some hotel or car totals still use partial stay or rental pricing."
        : "Persisted add-time prices from the trip snapshot.",
      updatedLabel: formatDateTime(trip.updatedAt),
      dateRangeLabel: formatTripDateRange(trip.startDate, trip.endDate),
      citiesLabel: trip.citiesInvolved.length
        ? trip.citiesInvolved.slice(0, 4).join(" · ")
        : null,
      bookingSessionLabel: trip.bookingSessionId
        ? shortenOpaqueId(trip.bookingSessionId)
        : null,
      continueHref: `/trips?trip=${trip.id}`,
      futureActions: FUTURE_ACTIONS,
    },
    groups,
    isEmpty: trip.items.length === 0,
  };
};

const toFlightItemModel = (item: TripItem): TripPageFlightItemModel => {
  const entity = asFlightEntity(item.bookableEntity);
  const routeSummary =
    [entity?.bookingContext.origin, entity?.bookingContext.destination]
      .filter((value): value is string => Boolean(value))
      .join(" -> ") ||
    [item.startCityName, item.endCityName]
      .filter((value): value is string => Boolean(value))
      .join(" -> ") ||
    item.subtitle ||
    item.title;
  const airlineSummary =
    [entity?.bookingContext.carrier || item.title, entity?.bookingContext.flightNumber]
      .filter((value): value is string => Boolean(value))
      .join(" ") || item.title;
  const departureLabel = formatDateTimeWithFallback(
    entity?.payload.departureAt || item.liveFlightDepartureAt,
    item.liveFlightServiceDate || item.startDate,
  );
  const arrivalLabel = formatDateTimeWithFallback(
    entity?.payload.arrivalAt || item.liveFlightArrivalAt,
    item.liveFlightServiceDate || item.endDate,
  );

  return {
    ...toItemBase(item),
    itemType: "flight",
    routeSummary,
    airlineSummary,
    departureLabel,
    arrivalLabel,
    itineraryLabel: toTitleCase(
      entity?.payload.itineraryType || item.liveFlightItineraryType || "",
    ),
  };
};

const toHotelItemModel = (item: TripItem): TripPageHotelItemModel => {
  const entity = asHotelEntity(item.bookableEntity);
  const propertySummary = entity?.payload.propertySummary || null;
  const roomSummary = entity?.payload.roomSummary || null;
  const nights = computeNights(item.startDate, item.endDate);

  return {
    ...toItemBase(item),
    itemType: "hotel",
    locationLabel:
      [
        propertySummary?.neighborhood,
        propertySummary?.cityName || item.startCityName || item.endCityName,
      ]
        .filter((value): value is string => Boolean(value))
        .join(" · ") ||
      item.subtitle ||
      item.title,
    stayLabel:
      formatTripDateRange(item.startDate, item.endDate) ||
      "Stay dates not available",
    roomSummary:
      [
        roomSummary?.roomName,
        roomSummary?.beds,
        roomSummary?.sleeps ? `Sleeps ${roomSummary.sleeps}` : null,
        nights != null ? `${nights} ${nights === 1 ? "night" : "nights"}` : null,
      ]
        .filter((value): value is string => Boolean(value))
        .join(" · ") || null,
  };
};

const toCarItemModel = (item: TripItem): TripPageCarItemModel => {
  const entity = asCarEntity(item.bookableEntity);
  const providerMetadata = entity?.payload.providerMetadata || null;
  const days = computeDays(item.startDate, item.endDate);
  const pickupLabel =
    providerMetadata?.pickupLocationName ||
    entity?.payload.pickupLocationName ||
    item.liveCarLocationName;
  const dropoffLabel =
    providerMetadata?.dropoffLocationName ||
    entity?.payload.dropoffLocationName ||
    item.liveCarLocationName;

  return {
    ...toItemBase(item),
    itemType: "car",
    locationLabel:
      [pickupLabel, dropoffLabel && dropoffLabel !== pickupLabel ? dropoffLabel : null]
        .filter((value): value is string => Boolean(value))
        .join(" -> ") ||
      item.liveCarLocationName ||
      item.startCityName ||
      item.endCityName ||
      "Pickup and dropoff pending",
    rentalLabel:
      [
        formatTripDateRange(item.startDate, item.endDate),
        days != null ? `${days} ${days === 1 ? "day" : "days"}` : null,
      ]
        .filter((value): value is string => Boolean(value))
        .join(" · ") || "Rental dates not available",
    vehicleSummary:
      [
        entity?.bookingContext.vehicleClass,
        entity?.payload.transmissionType,
        entity?.payload.seatingCapacity
          ? `${entity.payload.seatingCapacity} seats`
          : null,
      ]
        .filter((value): value is string => Boolean(value))
        .join(" · ") || item.subtitle,
    providerSummary:
      providerMetadata?.rentalCompany ||
      providerMetadata?.providerName ||
      entity?.provider ||
      null,
  };
};

const toItemBase = (item: TripItem): TripPageItemBase => {
  const priceDisplay = buildPriceDisplayFromMetadata(
    item.metadata,
    item.snapshotCurrencyCode,
  );
  const unitCountLabel = formatUnitCountLabel(
    priceDisplay?.baseQualifier,
    priceDisplay?.unitCount,
  );
  const qualifier = formatPriceQualifier(priceDisplay?.baseQualifier);
  const unitPrice =
    priceDisplay?.baseAmount != null
      ? `${formatMoney(priceDisplay.baseAmount, item.snapshotCurrencyCode)}${qualifier}`
      : null;
  const priceContextParts = [
    unitCountLabel,
    unitPrice && unitCountLabel ? unitPrice : null,
    priceDisplay?.supportText || null,
    `Saved in ${item.snapshotCurrencyCode}`,
  ].filter((value): value is string => Boolean(value));

  return {
    id: item.id,
    itemType: item.itemType,
    title: item.title,
    subtitle: item.subtitle,
    meta: item.meta,
    priceLabel: formatMoneyFromCents(
      item.snapshotPriceCents,
      item.snapshotCurrencyCode,
    ),
    priceContext: priceContextParts.join(" · "),
    addedLabel: formatDateTime(item.createdAt),
    viewHref: readBookableEntityHref(item),
    removeAction: REMOVE_ACTION,
  };
};

const readBookableEntityHref = (item: TripItem) => {
  const entityHref = item.bookableEntity?.href;
  if (entityHref) return entityHref;

  try {
    return buildBookableEntityPath(item.inventoryId);
  } catch {
    return null;
  }
};

const asFlightEntity = (value: BookableEntity | null | undefined) => {
  return value?.vertical === "flight" ? (value as FlightBookableEntity) : null;
};

const asHotelEntity = (value: BookableEntity | null | undefined) => {
  return value?.vertical === "hotel" ? (value as HotelBookableEntity) : null;
};

const asCarEntity = (value: BookableEntity | null | undefined) => {
  return value?.vertical === "car" ? (value as CarBookableEntity) : null;
};

const buildTripReference = (tripId: number) => {
  return `TRIP-${String(Math.max(0, tripId)).padStart(6, "0")}`;
};

const shortenOpaqueId = (value: string) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (trimmed.length <= 16) return trimmed;
  return `${trimmed.slice(0, 8)}...${trimmed.slice(-4)}`;
};

const formatSavedTotal = (trip: TripDetails) => {
  if (!trip.items.length) return "No items yet";
  if (trip.pricing.hasMixedCurrencies) return "Mixed currencies";

  return formatMoneyFromCents(
    trip.pricing.snapshotTotalCents ?? trip.estimatedTotalCents,
    trip.pricing.currencyCode || trip.currencyCode,
  );
};

const formatTripDateRange = (
  startDate: string | null | undefined,
  endDate: string | null | undefined,
) => {
  if (startDate && endDate && startDate !== endDate) {
    return `${formatIsoDate(startDate)} - ${formatIsoDate(endDate)}`;
  }
  if (startDate) return formatIsoDate(startDate);
  if (endDate) return formatIsoDate(endDate);
  return null;
};

const formatIsoDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const [year, month, day] = value
    .split("-")
    .map((part) => Number.parseInt(part, 10));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
};

const formatDateTimeWithFallback = (
  value: string | null | undefined,
  fallbackDate: string | null | undefined,
) => {
  if (value) return formatDateTime(value);
  if (fallbackDate) return formatIsoDate(fallbackDate);
  return null;
};

const toTitleCase = (value: string) => {
  const text = String(value || "").trim();
  if (!text) return "";

  return text
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
};
