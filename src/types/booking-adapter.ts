import type { BookableEntity, BookableVertical } from "~/types/bookable-entity";
import type { BookingErrorCode } from "~/types/booking";
import type {
  CheckoutInventoryReference,
  CheckoutItemSnapshot,
  CheckoutPricingSnapshot,
} from "~/types/checkout";
import type { ResolvedInventoryRecord } from "~/types/inventory";
import type { CheckoutPaymentSession, PaymentProvider } from "~/types/payment";
import type { MappedCheckoutTravelersForBooking } from "~/types/travelers";

export const PROVIDER_BOOKING_STATUSES = [
  "pending",
  "succeeded",
  "failed",
  "requires_manual_review",
] as const;
export type ProviderBookingStatus =
  (typeof PROVIDER_BOOKING_STATUSES)[number];

export const PROVIDER_BOOKING_ERROR_CODES = [
  "INVENTORY_UNAVAILABLE",
  "PRICE_MISMATCH",
  "VALIDATION_ERROR",
  "PAYMENT_DECLINED",
  "PROVIDER_UNAVAILABLE",
  "TIMEOUT",
  "UNSUPPORTED_PROVIDER",
  "READ_UNAVAILABLE",
  "UNKNOWN_PROVIDER_ERROR",
] as const;
export type ProviderBookingErrorCode =
  (typeof PROVIDER_BOOKING_ERROR_CODES)[number];

export type ProviderBookingInventorySnapshot = {
  inventoryId: string;
  providerInventoryId: number | null;
  snapshotTimestamp: string;
  pricing: CheckoutPricingSnapshot;
  providerMetadata: Record<string, unknown> | null;
  bookableEntity: BookableEntity | null;
  availability: CheckoutInventoryReference["availability"] | null;
};

export type ProviderBookingPaymentContext = {
  paymentSessionId: string;
  provider: PaymentProvider;
  status: CheckoutPaymentSession["status"];
  providerPaymentIntentId: string;
  currency: string;
  amount: number;
  authorizedAt: string | null;
  metadata: Record<string, unknown> | null;
};

export type ProviderTravelerContext = MappedCheckoutTravelersForBooking | null;

export type ProviderBookingResolvedInventorySummary = {
  inventoryId: string;
  provider: string | null;
  checkedAt: string;
  isAvailable: boolean | null;
};

export type CreateProviderBookingInput = {
  checkoutSessionId: string;
  bookingRunId: string;
  checkoutItemKey: string;
  vertical: BookableVertical;
  provider: string;
  canonicalEntityId: number | null;
  canonicalBookableEntityId: number | null;
  canonicalInventoryId: string;
  checkoutItem: CheckoutItemSnapshot;
  inventorySnapshot: ProviderBookingInventorySnapshot;
  latestResolvedInventory?: ResolvedInventoryRecord | null;
  travelerContext: ProviderTravelerContext;
  paymentContext: ProviderBookingPaymentContext;
  idempotencyKey: string;
  currency: string | null;
  amount: number | null;
  metadata?: Record<string, unknown> | null;
};

export type CreateProviderBookingResult = {
  status: ProviderBookingStatus;
  provider: string;
  vertical: BookableVertical;
  providerBookingReference: string | null;
  providerConfirmationCode: string | null;
  providerStatus: string | null;
  message: string | null;
  requestSnapshot: Record<string, unknown> | null;
  responseSnapshot: Record<string, unknown> | null;
  errorCode: ProviderBookingErrorCode | BookingErrorCode | null;
  errorMessage: string | null;
  requiresManualReview: boolean;
  retryable: boolean;
  latestResolvedInventory?: ProviderBookingResolvedInventorySummary | null;
};

export type GetProviderBookingInput = Omit<
  CreateProviderBookingInput,
  "latestResolvedInventory"
> & {
  providerBookingReference?: string | null;
  requestSnapshot?: Record<string, unknown> | null;
  responseSnapshot?: Record<string, unknown> | null;
};

export type GetProviderBookingResult = CreateProviderBookingResult & {
  supported: boolean;
};

export interface BookingAdapter {
  provider: string;
  vertical?: BookableVertical;
  createBooking(
    input: CreateProviderBookingInput,
  ): Promise<CreateProviderBookingResult>;
  getBooking?(
    input: GetProviderBookingInput,
  ): Promise<GetProviderBookingResult>;
  cancelBooking?(
    input: GetProviderBookingInput,
  ): Promise<GetProviderBookingResult>;
}

export type CreateBookingAdapterInput = CreateProviderBookingInput;
export type CreateBookingAdapterResult = CreateProviderBookingResult;
export type GetBookingAdapterInput = GetProviderBookingInput;
export type GetBookingAdapterResult = GetProviderBookingResult;
