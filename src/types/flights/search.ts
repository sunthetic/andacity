import type { AvailabilityConfidenceModel } from "~/lib/inventory/availability-confidence";
import type { InventoryFreshnessModel } from "~/lib/inventory/freshness";
import type { FlightSearchEntityPayload } from "~/lib/search/search-entities";
import type { BookableEntity } from "~/types/bookable-entity";
import type { SearchEntity } from "~/types/search-entity";

export type FlightCabinClass =
  | "economy"
  | "premium-economy"
  | "business"
  | "first";
export type FlightTimeWindow =
  | "morning"
  | "afternoon"
  | "evening"
  | "overnight";

export type FlightResult = {
  id: string;
  itineraryId?: number;
  canonicalInventoryId?: string;
  serviceDate?: string;
  airline: string;
  airlineCode?: string;
  flightNumber?: string | null;
  origin: string;
  destination: string;
  originCode?: string;
  destinationCode?: string;
  departureTime: string;
  arrivalTime: string;
  departureMinutes: number;
  arrivalMinutes: number;
  departureWindow: FlightTimeWindow;
  arrivalWindow: FlightTimeWindow;
  stops: 0 | 1 | 2;
  stopsLabel: string;
  duration: string;
  cabinClass?: FlightCabinClass;
  fareCode?: string | null;
  price: number;
  currency: string;
  refundable?: boolean | null;
  changeable?: boolean | null;
  checkedBagsIncluded?: number | null;
  seatsRemaining?: number | null;
  requestedServiceDate?: string;
  availabilityConfidence?: AvailabilityConfidenceModel;
  freshness?: InventoryFreshnessModel;
  searchEntity?: SearchEntity<FlightSearchEntityPayload>;
  bookableEntity?: BookableEntity<FlightSearchEntityPayload>;
};
