import type { BookableEntity, BookableVertical } from "~/types/bookable-entity";
import type { PriceQuote } from "~/types/pricing";

export const BOOKING_SESSION_STATUSES = [
  "active",
  "expired",
  "invalid",
  "consumed",
] as const;
export type BookingSessionStatus = (typeof BOOKING_SESSION_STATUSES)[number];

export const BOOKING_SESSION_SOURCES = ["inventory", "trip_item"] as const;
export type BookingSessionSource = (typeof BOOKING_SESSION_SOURCES)[number];

export type BookingSession = {
  sessionId: string;
  inventoryId: string;
  vertical: BookableVertical;
  provider: string;
  status: BookingSessionStatus;
  source: BookingSessionSource;
  tripItemId: number | null;
  entity: BookableEntity;
  price: PriceQuote;
  providerMetadata: Record<string, unknown>;
  createdAt: string;
  expiresAt: string;
};
