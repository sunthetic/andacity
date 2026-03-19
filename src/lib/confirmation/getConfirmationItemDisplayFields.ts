import type {
  CarBookableEntity,
  FlightBookableEntity,
  HotelBookableEntity,
} from "~/types/bookable-entity";
import type { BookingItemExecution } from "~/types/booking";
import type { CheckoutItemSnapshot } from "~/types/checkout";
import {
  isRecord,
  normalizeTimestamp,
  toNullableText,
} from "~/lib/confirmation/shared";

const getFlightEntity = (checkoutItem: CheckoutItemSnapshot | null) => {
  const value = checkoutItem?.inventory.bookableEntity;
  return isRecord(value) && value.vertical === "flight"
    ? (value as FlightBookableEntity)
    : null;
};

const getHotelEntity = (checkoutItem: CheckoutItemSnapshot | null) => {
  const value = checkoutItem?.inventory.bookableEntity;
  return isRecord(value) && value.vertical === "hotel"
    ? (value as HotelBookableEntity)
    : null;
};

const getCarEntity = (checkoutItem: CheckoutItemSnapshot | null) => {
  const value = checkoutItem?.inventory.bookableEntity;
  return isRecord(value) && value.vertical === "car"
    ? (value as CarBookableEntity)
    : null;
};

const normalizeDateOrDateTime = (value: unknown) => {
  const text = toNullableText(value);
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return normalizeTimestamp(`${text}T00:00:00.000Z`);
  }
  return normalizeTimestamp(text);
};

const compactParts = (parts: Array<string | null | undefined>) => {
  return parts
    .map((part) => toNullableText(part))
    .filter((part): part is string => Boolean(part))
    .join(" · ");
};

const compactRoute = (origin: string | null | undefined, destination: string | null | undefined) => {
  const from = toNullableText(origin);
  const to = toNullableText(destination);
  if (from && to) return `${from} to ${to}`;
  return from || to || null;
};

export const getConfirmationItemDisplayFields = (input: {
  bookingItemExecution: BookingItemExecution;
  checkoutItem: CheckoutItemSnapshot | null;
}) => {
  const { bookingItemExecution, checkoutItem } = input;

  if (bookingItemExecution.vertical === "flight") {
    const entity = getFlightEntity(checkoutItem);

    return {
      title: checkoutItem?.title || bookingItemExecution.title,
      subtitle:
        checkoutItem?.subtitle ||
        compactParts([
          entity?.bookingContext.carrier,
          entity?.bookingContext.flightNumber,
        ]) ||
        null,
      startAt:
        normalizeDateOrDateTime(entity?.payload.departureAt) ||
        normalizeDateOrDateTime(entity?.bookingContext.departDate) ||
        normalizeDateOrDateTime(checkoutItem?.startDate),
      endAt:
        normalizeDateOrDateTime(entity?.payload.arrivalAt) ||
        normalizeDateOrDateTime(checkoutItem?.endDate),
      locationSummary:
        compactRoute(
          entity?.bookingContext.origin,
          entity?.bookingContext.destination,
        ) || null,
      detailsJson: {
        tripItemId: checkoutItem?.tripItemId || bookingItemExecution.tripItemId,
        inventoryId: checkoutItem?.inventory.inventoryId || null,
        meta: checkoutItem?.meta || [],
        carrier: entity?.bookingContext.carrier || null,
        flightNumber: entity?.bookingContext.flightNumber || null,
        itineraryType: entity?.payload.itineraryType || null,
        segments: entity?.payload.segments || null,
      } satisfies Record<string, unknown>,
    };
  }

  if (bookingItemExecution.vertical === "hotel") {
    const entity = getHotelEntity(checkoutItem);

    return {
      title: checkoutItem?.title || bookingItemExecution.title,
      subtitle:
        checkoutItem?.subtitle ||
        entity?.payload.roomSummary?.roomName ||
        entity?.bookingContext.roomType ||
        null,
      startAt:
        normalizeDateOrDateTime(entity?.bookingContext.checkInDate) ||
        normalizeDateOrDateTime(checkoutItem?.startDate),
      endAt:
        normalizeDateOrDateTime(entity?.bookingContext.checkOutDate) ||
        normalizeDateOrDateTime(checkoutItem?.endDate),
      locationSummary:
        compactParts([
          entity?.payload.propertySummary?.cityName,
          entity?.payload.propertySummary?.neighborhood,
          entity?.payload.propertySummary?.addressLine,
        ]) || null,
      detailsJson: {
        tripItemId: checkoutItem?.tripItemId || bookingItemExecution.tripItemId,
        inventoryId: checkoutItem?.inventory.inventoryId || null,
        meta: checkoutItem?.meta || [],
        cityName: entity?.payload.propertySummary?.cityName || null,
        neighborhood: entity?.payload.propertySummary?.neighborhood || null,
        roomName: entity?.payload.roomSummary?.roomName || null,
        occupancy: entity?.bookingContext.occupancy || null,
        nights: entity?.payload.priceSummary?.nights || null,
      } satisfies Record<string, unknown>,
    };
  }

  const entity = getCarEntity(checkoutItem);
  return {
    title: checkoutItem?.title || bookingItemExecution.title,
    subtitle:
      checkoutItem?.subtitle ||
      entity?.bookingContext.vehicleClass ||
      entity?.payload.ratePlan ||
      null,
    startAt:
      normalizeDateOrDateTime(entity?.bookingContext.pickupDateTime) ||
      normalizeDateOrDateTime(checkoutItem?.startDate),
    endAt:
      normalizeDateOrDateTime(entity?.bookingContext.dropoffDateTime) ||
      normalizeDateOrDateTime(checkoutItem?.endDate),
    locationSummary:
      compactRoute(
        entity?.payload.pickupLocationName || null,
        entity?.payload.dropoffLocationName || null,
      ) || null,
    detailsJson: {
      tripItemId: checkoutItem?.tripItemId || bookingItemExecution.tripItemId,
      inventoryId: checkoutItem?.inventory.inventoryId || null,
      meta: checkoutItem?.meta || [],
      pickupLocationName: entity?.payload.pickupLocationName || null,
      dropoffLocationName: entity?.payload.dropoffLocationName || null,
      vehicleClass: entity?.bookingContext.vehicleClass || null,
      ratePlan: entity?.payload.ratePlan || null,
      features: entity?.payload.features || [],
    } satisfies Record<string, unknown>,
  };
};
