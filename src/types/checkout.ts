import type { BookableEntity, BookableVertical } from "~/types/bookable-entity";
import type { BookingExecutionStatus } from "~/types/booking";
import type {
  BookingConfirmationPublicRef,
  BookingConfirmationStatus,
} from "~/types/confirmation";
import type {
  TripDetails,
  TripItemAvailabilitySnapshot,
  TripItemType,
} from "~/types/trips/trip";

export const CHECKOUT_SESSION_STATUSES = [
  "draft",
  "blocked",
  "ready",
  "expired",
  "completed",
  "abandoned",
] as const;

export const TERMINAL_CHECKOUT_SESSION_STATUSES = [
  "expired",
  "completed",
  "abandoned",
] as const;

export type CheckoutSessionStatus = (typeof CHECKOUT_SESSION_STATUSES)[number];

export const CHECKOUT_SESSION_ENTRY_MODES = ["created", "resumed"] as const;
export type CheckoutSessionEntryMode =
  (typeof CHECKOUT_SESSION_ENTRY_MODES)[number];

export const CHECKOUT_REVALIDATION_STATUSES = [
  "idle",
  "pending",
  "passed",
  "failed",
] as const;
export type CheckoutRevalidationStatus =
  (typeof CHECKOUT_REVALIDATION_STATUSES)[number];

export const CHECKOUT_ITEM_REVALIDATION_STATUSES = [
  "passed",
  "price_changed",
  "unavailable",
  "changed",
  "failed",
] as const;
export type CheckoutItemRevalidationStatus =
  (typeof CHECKOUT_ITEM_REVALIDATION_STATUSES)[number];

export const CHECKOUT_READINESS_STATES = ["blocked", "ready"] as const;
export type CheckoutReadinessState = (typeof CHECKOUT_READINESS_STATES)[number];

export const CHECKOUT_ENTRY_ERROR_CODES = [
  "TRIP_NOT_FOUND",
  "TRIP_EMPTY",
  "TRIP_INVALID",
  "CHECKOUT_CREATE_FAILED",
  "CHECKOUT_RESUME_FAILED",
] as const;
export type CheckoutEntryErrorCode =
  (typeof CHECKOUT_ENTRY_ERROR_CODES)[number];

export const TRIP_CHECKOUT_READINESS_ISSUE_CODES = [
  "no_trip",
  "no_items",
  "missing_pricing_snapshot",
  "missing_inventory_reference",
  "unsupported_item_shape",
] as const;
export type TripCheckoutReadinessIssueCode =
  (typeof TRIP_CHECKOUT_READINESS_ISSUE_CODES)[number];

export type TripCheckoutReadinessIssue = {
  code: TripCheckoutReadinessIssueCode;
  message: string;
  itemId: number | null;
  itemTitle: string | null;
};

export type TripCheckoutReadiness = {
  isReady: boolean;
  issues: TripCheckoutReadinessIssue[];
  itemCount: number;
  currency: string | null;
  estimatedTotal: number | null;
  readinessLabel: string;
};

export type CheckoutPricingSnapshot = {
  currencyCode: string | null;
  baseAmountCents: number | null;
  taxesAmountCents: number | null;
  feesAmountCents: number | null;
  totalAmountCents: number | null;
};

export type CheckoutInventoryReference = {
  inventoryId: string;
  providerInventoryId: number | null;
  hotelAvailabilitySnapshotId: number | null;
  availability: TripItemAvailabilitySnapshot | null;
  bookableEntity: BookableEntity | null;
  // Reserved for adapter-facing revalidation and booking handoff work in later tasks.
  providerMetadata: Record<string, unknown> | null;
};

export type CheckoutItemSnapshot = {
  tripItemId: number;
  itemType: TripItemType;
  vertical: BookableVertical;
  entityId: number | null;
  bookableEntityId: number | null;
  inventory: CheckoutInventoryReference;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  meta: string[];
  startDate: string | null;
  endDate: string | null;
  snapshotTimestamp: string;
  pricing: CheckoutPricingSnapshot;
};

export type CheckoutItemRevalidationResult = {
  tripItemId: number;
  itemType: TripItemType;
  vertical: BookableVertical;
  title: string;
  subtitle: string | null;
  status: CheckoutItemRevalidationStatus;
  message: string | null;
  previousPricing: CheckoutPricingSnapshot;
  currentPricing: CheckoutPricingSnapshot | null;
  previousInventory: CheckoutInventoryReference | null;
  currentInventory: CheckoutInventoryReference | null;
  providerMetadata: Record<string, unknown> | null;
};

export type CheckoutRevalidationSummary = {
  status: CheckoutRevalidationStatus;
  checkedAt: string;
  itemResults: CheckoutItemRevalidationResult[];
  allItemsPassed: boolean;
  blockingIssueCount: number;
  priceChangeCount: number;
  unavailableCount: number;
  changedCount: number;
  failedCount: number;
  currentTotals: CheckoutPricingSnapshot | null;
};

export type CheckoutSession = {
  id: string;
  tripId: number;
  status: CheckoutSessionStatus;
  revalidationStatus: CheckoutRevalidationStatus;
  revalidationSummary: CheckoutRevalidationSummary | null;
  lastRevalidatedAt: string | null;
  currencyCode: string | null;
  items: CheckoutItemSnapshot[];
  totals: CheckoutPricingSnapshot;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  completedAt: string | null;
  abandonedAt: string | null;
};

export type CheckoutSessionSummary = {
  id: string;
  shortId: string;
  tripId: number;
  tripReference: string;
  tripHref: string;
  status: CheckoutSessionStatus;
  statusLabel: string;
  statusDescription: string;
  itemCount: number;
  currencyCode: string | null;
  totalAmountCents: number | null;
  totalLabel: string;
  updatedAt: string;
  updatedLabel: string;
  expiresAt: string;
  expiresLabel: string;
  entryMode: CheckoutSessionEntryMode | null;
  revalidationStatus: CheckoutRevalidationStatus;
  readinessState: CheckoutReadinessState;
  lastRevalidatedAt: string | null;
  lastRevalidatedLabel: string | null;
  canReturnToTrip: boolean;
  readinessLabel: string | null;
  canProceed: boolean;
  blockingIssueCount: number;
  bookingStatus: BookingExecutionStatus;
  activeBookingRunId: string | null;
  hasCompletedBooking: boolean;
  hasConfirmation: boolean;
  confirmationStatus: BookingConfirmationStatus | null;
  confirmationPublicRef: BookingConfirmationPublicRef | null;
};

export type CheckoutEntrySuccessResult = {
  ok: true;
  checkoutSessionId: string;
  redirectTo: string;
  entryMode: CheckoutSessionEntryMode;
};

export type CheckoutEntryFailureResult = {
  ok: false;
  code: CheckoutEntryErrorCode;
  message: string;
};

export type CheckoutEntryResult =
  | CheckoutEntrySuccessResult
  | CheckoutEntryFailureResult;

export type CreateCheckoutSessionInput = {
  trip: TripDetails;
  now?: Date | string | null;
  ttlMs?: number;
};

export type CreateCheckoutSessionResult = {
  session: CheckoutSession;
  createdNew: boolean;
  entryMode: CheckoutSessionEntryMode;
  redirectTo: string;
};
