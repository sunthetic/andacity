import type { BookingItemExecution, BookingRun } from "~/types/booking";
import type { BookableVertical } from "~/types/bookable-entity";
import type { CheckoutSession } from "~/types/checkout";
import type { ItineraryStatus } from "~/types/itinerary";
import type { NotificationSummary } from "~/types/notifications";
import type { CheckoutPaymentSession } from "~/types/payment";

export const BOOKING_CONFIRMATION_STATUSES = [
  "pending",
  "partial",
  "confirmed",
  "requires_manual_review",
  "failed",
] as const;
export type BookingConfirmationStatus =
  (typeof BOOKING_CONFIRMATION_STATUSES)[number];

export const CONFIRMATION_ITEM_STATUSES = [
  "confirmed",
  "pending",
  "failed",
  "requires_manual_review",
] as const;
export type ConfirmationItemStatus =
  (typeof CONFIRMATION_ITEM_STATUSES)[number];

export type BookingConfirmationPublicRef = string;

export const CONFIRMATION_REF_PATTERN = /^CNF-[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/;

export const normalizeConfirmationRef = (value: unknown): string => {
  return String(value || "")
    .trim()
    .toUpperCase();
};

export const isConfirmationRef = (value: unknown): value is string => {
  const normalized = normalizeConfirmationRef(value);
  return Boolean(normalized) && CONFIRMATION_REF_PATTERN.test(normalized);
};

export type BookingConfirmationItem = {
  id: string;
  confirmationId: string;
  bookingItemExecutionId: string;
  checkoutItemKey: string;
  vertical: BookableVertical;
  status: ConfirmationItemStatus;
  title: string;
  subtitle: string | null;
  startAt: string | null;
  endAt: string | null;
  locationSummary: string | null;
  provider: string | null;
  providerBookingReference: string | null;
  providerConfirmationCode: string | null;
  detailsJson: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type BookingConfirmationSummary = {
  confirmationId: string;
  publicRef: BookingConfirmationPublicRef;
  status: BookingConfirmationStatus;
  statusLabel: string;
  statusDescription: string;
  totalItemCount: number;
  confirmedItemCount: number;
  pendingItemCount: number;
  failedItemCount: number;
  requiresManualReviewCount: number;
  unresolvedItemCount: number;
  confirmedItemTitles: string[];
  unresolvedItemTitles: string[];
  currency: string | null;
  totalAmountCents: number | null;
  confirmedAt: string | null;
  hasItinerary: boolean;
  itineraryRef: string | null;
  itineraryStatus: ItineraryStatus | null;
};

export type BookingConfirmation = {
  id: string;
  publicRef: BookingConfirmationPublicRef;
  tripId: number;
  checkoutSessionId: string;
  paymentSessionId: string;
  bookingRunId: string;
  status: BookingConfirmationStatus;
  currency: string | null;
  totalsJson: Record<string, unknown> | null;
  summaryJson: BookingConfirmationSummary | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: BookingConfirmationItem[];
  notificationSummary?: NotificationSummary | null;
};

export type CreateBookingConfirmationInput = {
  bookingRun: BookingRun;
  checkoutSession: CheckoutSession;
  paymentSession: CheckoutPaymentSession;
  now?: Date | string | null;
};

export type MapBookingItemExecutionToConfirmationItemInput = {
  confirmationId: string;
  bookingItemExecution: BookingItemExecution;
  checkoutSession: CheckoutSession;
  now?: Date | string | null;
};
