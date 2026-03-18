import type { BookableVertical } from "~/types/bookable-entity";
import type {
  BookingErrorCode,
  BookingItemExecution,
  BookingItemExecutionStatus,
  BookingRun,
} from "~/types/booking";
import type { CheckoutItemSnapshot, CheckoutSession } from "~/types/checkout";
import type { CheckoutPaymentSession } from "~/types/payment";

export type CreateBookingAdapterInput = {
  checkoutSession: CheckoutSession;
  paymentSession: CheckoutPaymentSession;
  checkoutItem: CheckoutItemSnapshot;
  bookingRun: BookingRun;
  bookingItemExecution: BookingItemExecution;
  provider: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown> | null;
};

export type CreateBookingAdapterResult = {
  status: Extract<
    BookingItemExecutionStatus,
    "pending" | "succeeded" | "failed" | "requires_manual_review"
  >;
  provider: string;
  vertical: BookableVertical;
  providerBookingReference: string | null;
  providerConfirmationCode: string | null;
  message: string | null;
  requestSnapshot: Record<string, unknown> | null;
  responseSnapshot: Record<string, unknown> | null;
  errorCode: BookingErrorCode | null;
  errorMessage: string | null;
};

export type GetBookingAdapterResult = {
  status: CreateBookingAdapterResult["status"];
  provider: string;
  providerBookingReference: string | null;
  providerConfirmationCode: string | null;
  responseSnapshot: Record<string, unknown> | null;
  errorCode: BookingErrorCode | null;
  errorMessage: string | null;
};

export interface BookingAdapter {
  provider: string;
  vertical?: BookableVertical;
  createBooking(
    input: CreateBookingAdapterInput,
  ): Promise<CreateBookingAdapterResult>;
  getBooking?(
    input: Pick<
      CreateBookingAdapterInput,
      "provider" | "checkoutItem" | "idempotencyKey"
    > & {
      providerBookingReference?: string | null;
    },
  ): Promise<GetBookingAdapterResult>;
  cancelBooking?(
    input: Pick<
      CreateBookingAdapterInput,
      "provider" | "checkoutItem" | "idempotencyKey"
    > & {
      providerBookingReference?: string | null;
    },
  ): Promise<GetBookingAdapterResult>;
}
