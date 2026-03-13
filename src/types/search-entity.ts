import type {
  FlightItineraryType,
  FlightPolicySummary,
  FlightProviderMetadata,
  FlightSegmentSummary,
} from "~/types/flights/provider";
import type {
  HotelPolicySummary,
  HotelPriceSummary,
  HotelProviderMetadata,
} from "~/types/hotels/provider";
import type {
  CarPolicySummary,
  CarPriceSummary,
  CarProviderMetadata,
} from "~/types/car-rentals/provider";

export type SearchVertical = "flight" | "hotel" | "car";

export type SearchEntityPrice = {
  amountCents: number | null;
  currency: string | null;
  displayText?: string | null;
};

export type FlightSearchEntityPayload = {
  providerInventoryId: number | null;
  airlineCode: string | null;
  flightNumber: string | null;
  departDate: string | null;
  originCode: string | null;
  destinationCode: string | null;
  cabinClass?: string | null;
  fareCode?: string | null;
  departureAt?: string | null;
  arrivalAt?: string | null;
  itineraryType?: FlightItineraryType | null;
  policy?: FlightPolicySummary | null;
  segments?: FlightSegmentSummary[] | null;
  providerMetadata?: FlightProviderMetadata | null;
};

export type HotelSearchEntityPayload = {
  providerInventoryId: number | null;
  hotelId: string;
  hotelSlug: string | null;
  checkInDate: string | null;
  checkOutDate: string | null;
  roomType: string | null;
  occupancy: number | null;
  providerOfferId?: string | null;
  ratePlanId?: string | null;
  ratePlan?: string | null;
  boardType?: string | null;
  cancellationPolicy?: string | null;
  policy?: HotelPolicySummary | null;
  priceSummary?: HotelPriceSummary | null;
  inclusions?: string[] | null;
  providerMetadata?: HotelProviderMetadata | null;
  assumedStayDates?: boolean;
  assumedOccupancy?: boolean;
};

export type CarSearchEntityPayload = {
  providerInventoryId: number | null;
  providerLocationId: string | null;
  pickupDateTime: string | null;
  dropoffDateTime: string | null;
  vehicleClass: string | null;
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

export type SearchEntityBase<
  TVertical extends SearchVertical,
  TPayload extends Record<string, unknown> = Record<string, unknown>,
> = {
  inventoryId: string;
  vertical: TVertical;
  provider: string | null;
  snapshotTimestamp: string | null;
  price: SearchEntityPrice;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  href: string | null;
  payload: TPayload;
};

export type FlightSearchEntity<
  TPayload extends Record<string, unknown> = FlightSearchEntityPayload,
> = SearchEntityBase<"flight", TPayload> & {
  route: {
    origin: string | null;
    destination: string | null;
    departDate: string | null;
  };
  metadata: {
    carrier?: string | null;
    flightNumber?: string | null;
    stops?: number | null;
    durationMinutes?: number | null;
  };
};

export type HotelSearchEntity<
  TPayload extends Record<string, unknown> = HotelSearchEntityPayload,
> = SearchEntityBase<"hotel", TPayload> & {
  stay: {
    checkInDate: string | null;
    checkOutDate: string | null;
    occupancy: number | null;
  };
  metadata: {
    hotelId?: string | null;
    roomType?: string | null;
    stars?: number | null;
    rating?: number | null;
    reviewCount?: number | null;
    neighborhood?: string | null;
    cityName?: string | null;
    ratePlan?: string | null;
    boardType?: string | null;
    cancellationPolicy?: string | null;
  };
};

export type CarSearchEntity<
  TPayload extends Record<string, unknown> = CarSearchEntityPayload,
> = SearchEntityBase<"car", TPayload> & {
  rental: {
    pickupDateTime: string | null;
    dropoffDateTime: string | null;
  };
  metadata: {
    providerLocationId?: string | null;
    vehicleClass?: string | null;
    transmission?: string | null;
    seats?: number | null;
    pickupArea?: string | null;
    dropoffArea?: string | null;
    luggageCapacity?: string | null;
    doors?: number | null;
    pickupLocationType?: string | null;
    dropoffLocationType?: string | null;
  };
};

export type SearchEntity<
  TPayload extends Record<string, unknown> = Record<string, unknown>,
> =
  | FlightSearchEntity<TPayload>
  | HotelSearchEntity<TPayload>
  | CarSearchEntity<TPayload>;
