import type {
  FlightItineraryType,
  FlightPolicySummary,
  FlightProviderMetadata,
  FlightSegmentSummary,
} from "~/types/flights/provider";
import type {
  HotelPropertySummary,
  HotelPolicySummary,
  HotelPriceSummary,
  HotelProviderMetadata,
  HotelRoomSummary,
} from "~/types/hotels/provider";
import type {
  CarPolicySummary,
  CarPriceSummary,
  CarProviderMetadata,
} from "~/types/car-rentals/provider";

export const BOOKABLE_VERTICALS = ["flight", "hotel", "car"] as const;
export type BookableVertical = (typeof BOOKABLE_VERTICALS)[number];

export const BOOKABLE_ENTITY_SOURCES = [
  "search",
  "trip_item",
  "saved_item",
] as const;
export type BookableEntitySource = (typeof BOOKABLE_ENTITY_SOURCES)[number];

export const BOOKABLE_PRICE_SOURCES = [
  "live",
  "snapshot",
  "display_only",
] as const;
export type BookablePriceSource = (typeof BOOKABLE_PRICE_SOURCES)[number];

export type BookableEntityPrice = {
  amountCents: number | null;
  currency: string | null;
  displayText?: string | null;
};

export type BookableEntityBase<
  TVertical extends BookableVertical,
  TBookingContext extends Record<string, unknown>,
  TPayload extends Record<string, unknown>,
> = {
  inventoryId: string;
  vertical: TVertical;
  provider: string | null;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  href: string | null;
  snapshotTimestamp: string | null;
  price: BookableEntityPrice;
  bookingContext: TBookingContext;
  payload: TPayload;
};

export type FlightBookableEntityPayload = {
  source: BookableEntitySource;
  priceSource: BookablePriceSource;
  providerInventoryId: number | null;
  cabinClass: string | null;
  fareCode: string | null;
  departureAt?: string | null;
  arrivalAt?: string | null;
  itineraryType?: FlightItineraryType | null;
  policy?: FlightPolicySummary | null;
  segments?: FlightSegmentSummary[] | null;
  providerMetadata?: FlightProviderMetadata | null;
};

export type HotelBookableEntityPayload = {
  source: BookableEntitySource;
  priceSource: BookablePriceSource;
  providerInventoryId: number | null;
  hotelSlug: string | null;
  providerOfferId?: string | null;
  ratePlanId?: string | null;
  ratePlan?: string | null;
  boardType?: string | null;
  cancellationPolicy?: string | null;
  policy?: HotelPolicySummary | null;
  priceSummary?: HotelPriceSummary | null;
  propertySummary?: HotelPropertySummary | null;
  roomSummary?: HotelRoomSummary | null;
  inclusions?: string[] | null;
  providerMetadata?: HotelProviderMetadata | null;
  assumedStayDates?: boolean;
  assumedOccupancy?: boolean;
};

export type CarBookableEntityPayload = {
  source: BookableEntitySource;
  priceSource: BookablePriceSource;
  providerInventoryId: number | null;
  pickupLocationName?: string | null;
  dropoffLocationName?: string | null;
  pickupLocationType?: string | null;
  dropoffLocationType?: string | null;
  pickupAddressLine?: string | null;
  dropoffAddressLine?: string | null;
  transmissionType?: string | null;
  seatingCapacity?: number | null;
  luggageCapacity?: string | null;
  doors?: number | null;
  airConditioning?: boolean | null;
  fuelPolicy?: string | null;
  mileagePolicy?: string | null;
  ratePlanCode?: string | null;
  ratePlan?: string | null;
  policy?: CarPolicySummary | null;
  priceSummary?: CarPriceSummary | null;
  inclusions?: string[] | null;
  badges?: string[] | null;
  features?: string[] | null;
  providerMetadata?: CarProviderMetadata | null;
  assumedRentalWindow?: boolean;
};

export type FlightBookableEntity = BookableEntityBase<
  "flight",
  {
    carrier: string | null;
    flightNumber: string | null;
    origin: string | null;
    destination: string | null;
    departDate: string | null;
  },
  FlightBookableEntityPayload
>;

export type HotelBookableEntity = BookableEntityBase<
  "hotel",
  {
    hotelId: string | null;
    checkInDate: string | null;
    checkOutDate: string | null;
    roomType: string | null;
    occupancy: number | null;
  },
  HotelBookableEntityPayload
>;

export type CarBookableEntity = BookableEntityBase<
  "car",
  {
    providerLocationId: string | null;
    pickupDateTime: string | null;
    dropoffDateTime: string | null;
    vehicleClass: string | null;
  },
  CarBookableEntityPayload
>;

export type BookableEntity =
  | FlightBookableEntity
  | HotelBookableEntity
  | CarBookableEntity;
