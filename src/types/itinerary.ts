import type { BookableVertical } from "~/types/bookable-entity";
import type { BookingConfirmation } from "~/types/confirmation";
import type { BookingRun } from "~/types/booking";
import type { CheckoutSession } from "~/types/checkout";
import type {
  ItineraryAccessResult,
  ItineraryOwnership,
  OwnershipMode,
} from "~/types/ownership";
import type { CheckoutPaymentSession } from "~/types/payment";

export const ITINERARY_STATUSES = [
  "active",
  "partial",
  "upcoming",
  "in_progress",
  "completed",
  "canceled",
  "archived",
] as const;
export type ItineraryStatus = (typeof ITINERARY_STATUSES)[number];

export const ITINERARY_ITEM_STATUSES = [
  "confirmed",
  "pending",
  "in_progress",
  "completed",
  "canceled",
  "failed",
] as const;
export type ItineraryItemStatus = (typeof ITINERARY_ITEM_STATUSES)[number];

export type ItineraryOwnershipRef = {
  ownerUserId: string | null;
  ownerSessionId: string | null;
};

export type OwnedItineraryItem = {
  id: string;
  itineraryId: string;
  confirmationItemId: string;
  bookingItemExecutionId: string;
  checkoutItemKey: string;
  vertical: BookableVertical;
  status: ItineraryItemStatus;
  canonicalEntityId: number | null;
  canonicalBookableEntityId: number | null;
  canonicalInventoryId: string | null;
  provider: string | null;
  providerBookingReference: string | null;
  providerConfirmationCode: string | null;
  title: string;
  subtitle: string | null;
  startAt: string | null;
  endAt: string | null;
  locationSummary: string | null;
  detailsJson: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type OwnedItinerary = ItineraryOwnershipRef & {
  id: string;
  publicRef: string;
  tripId: number | null;
  checkoutSessionId: string;
  paymentSessionId: string;
  bookingRunId: string;
  confirmationId: string;
  status: ItineraryStatus;
  currency: string | null;
  summaryJson: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  ownership: ItineraryOwnership | null;
  items: OwnedItineraryItem[];
};

export type CreateItineraryFromConfirmationInput = ItineraryOwnershipRef & {
  confirmation: BookingConfirmation;
  bookingRun: BookingRun;
  checkoutSession: CheckoutSession;
  paymentSession: CheckoutPaymentSession;
  now?: Date | string | null;
};

export type ItinerarySummary = {
  itineraryId: string;
  publicRef: string;
  tripId: number | null;
  confirmationId: string;
  status: ItineraryStatus;
  statusLabel: string;
  statusDescription: string;
  currency: string | null;
  ownershipMode: OwnershipMode | null;
  isOwnedByCurrentContext: boolean;
  isClaimable: boolean;
  canAttachToUser: boolean;
  itemCount: number;
  title: string;
  locationSummary: string | null;
  startAt: string | null;
  endAt: string | null;
  ownerUserId: string | null;
  ownerSessionId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ItineraryItemDisplayFields = {
  title: string;
  subtitle: string | null;
  dateLabel: string | null;
  locationLabel: string | null;
  statusLabel: string;
  statusTone: "success" | "warning" | "error" | "info";
  providerLabel: string | null;
  confirmationCode: string | null;
  bookingReference: string | null;
};

export type ItineraryDetail = {
  itineraryId: string;
  publicRef: string;
  tripId: number | null;
  tripHref: string | null;
  status: ItineraryStatus;
  statusLabel: string;
  statusDescription: string;
  currency: string | null;
  ownershipMode: OwnershipMode | null;
  isOwnedByCurrentContext: boolean;
  isClaimable: boolean;
  canAttachToUser: boolean;
  confirmationId: string;
  checkoutSessionId: string;
  paymentSessionId: string;
  bookingRunId: string;
  owner: ItineraryOwnershipRef;
  createdAt: string;
  updatedAt: string;
  access: ItineraryAccessResult | null;
  summary: ItinerarySummary;
  items: Array<
    OwnedItineraryItem & {
      display: ItineraryItemDisplayFields;
    }
  >;
};
