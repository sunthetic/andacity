import { createHash } from "node:crypto";
import type { CarBookableEntity, HotelBookableEntity } from "~/types/bookable-entity";
import { detectPriceDrift } from "~/lib/inventory/detectPriceDrift";
import { resolveInventoryRecord } from "~/lib/inventory/resolveInventory";
import type {
  CreateProviderBookingInput,
  CreateProviderBookingResult,
  ProviderBookingErrorCode,
  ProviderBookingResolvedInventorySummary,
} from "~/types/booking-adapter";
import type { PriceQuote } from "~/types/pricing";

const hasCode = (
  value: unknown,
): value is { code?: string; errorCode?: string; message?: string } =>
  Boolean(value) && typeof value === "object";

export const toNullableText = (value: unknown) => {
  const text = String(value ?? "").trim();
  return text ? text : null;
};

export const toPositiveInteger = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return null;
  return Math.round(parsed);
};

const centsToAmount = (value: number | null | undefined) =>
  value == null ? undefined : Math.round(value) / 100;

export const normalizeTimestamp = (
  value: Date | string | number | null | undefined,
) => {
  const date =
    value instanceof Date ? value : value != null ? new Date(value) : new Date();
  return Number.isNaN(date.getTime())
    ? new Date().toISOString()
    : date.toISOString();
};

const buildStableHash = (value: string) =>
  createHash("sha1").update(value).digest("hex");

export const buildStableBookingReference = (
  prefix: string,
  input: Pick<CreateProviderBookingInput, "idempotencyKey" | "checkoutItemKey">,
) => `${prefix}_${buildStableHash(`${input.idempotencyKey}:${input.checkoutItemKey}`).slice(0, 14)}`;

export const buildStableConfirmationCode = (prefix: string, seed: string) =>
  `${prefix}${buildStableHash(seed).slice(0, 6)}`.toUpperCase();

export const summarizeResolvedInventory = (
  latestResolvedInventory: Awaited<ReturnType<typeof resolveInventoryRecord>>,
): ProviderBookingResolvedInventorySummary | null => {
  if (!latestResolvedInventory) return null;

  return {
    inventoryId: latestResolvedInventory.entity.inventoryId,
    provider: latestResolvedInventory.entity.provider,
    checkedAt: latestResolvedInventory.checkedAt,
    isAvailable: latestResolvedInventory.isAvailable,
  };
};

export const buildSnapshotPriceQuote = (
  input: CreateProviderBookingInput,
): PriceQuote | null => {
  const currency =
    toNullableText(input.currency)?.toUpperCase() ||
    toNullableText(input.inventorySnapshot.pricing.currencyCode)?.toUpperCase() ||
    null;
  const amountCents = input.inventorySnapshot.pricing.totalAmountCents;
  if (!currency || amountCents == null) return null;

  const baseAmountCents = input.inventorySnapshot.pricing.baseAmountCents;
  const taxesAmountCents = input.inventorySnapshot.pricing.taxesAmountCents;
  const feesAmountCents = input.inventorySnapshot.pricing.feesAmountCents;

  if (input.vertical === "hotel") {
    const entity = input.inventorySnapshot.bookableEntity as HotelBookableEntity | null;
    return {
      currency,
      amount: amountCents / 100,
      base: centsToAmount(baseAmountCents),
      taxes: centsToAmount(taxesAmountCents),
      fees: centsToAmount(feesAmountCents),
      nightly: centsToAmount(entity?.payload.priceSummary?.nightlyBaseCents),
      nights: entity?.payload.priceSummary?.nights ?? undefined,
    };
  }

  if (input.vertical === "car") {
    const entity = input.inventorySnapshot.bookableEntity as CarBookableEntity | null;
    return {
      currency,
      amount: amountCents / 100,
      base: centsToAmount(baseAmountCents),
      taxes: centsToAmount(taxesAmountCents),
      fees: centsToAmount(feesAmountCents),
      daily: centsToAmount(entity?.payload.priceSummary?.dailyBaseCents),
      days: entity?.payload.priceSummary?.days ?? undefined,
    };
  }

  return {
    currency,
    amount: amountCents / 100,
    base: centsToAmount(baseAmountCents),
    taxes: centsToAmount(taxesAmountCents),
    fees: centsToAmount(feesAmountCents),
  };
};

export const buildFailureResult = (input: {
  provider: string;
  vertical: CreateProviderBookingInput["vertical"];
  status?: CreateProviderBookingResult["status"];
  providerStatus?: string | null;
  providerBookingReference?: string | null;
  providerConfirmationCode?: string | null;
  message: string;
  errorCode: ProviderBookingErrorCode;
  errorMessage?: string | null;
  requestSnapshot?: Record<string, unknown> | null;
  responseSnapshot?: Record<string, unknown> | null;
  requiresManualReview?: boolean;
  retryable?: boolean;
  latestResolvedInventory?: Awaited<ReturnType<typeof resolveInventoryRecord>>;
}): CreateProviderBookingResult => ({
  status: input.status || "failed",
  provider: input.provider,
  vertical: input.vertical,
  providerBookingReference: input.providerBookingReference || null,
  providerConfirmationCode: input.providerConfirmationCode || null,
  providerStatus: input.providerStatus || null,
  message: input.message,
  requestSnapshot: input.requestSnapshot || null,
  responseSnapshot: input.responseSnapshot || null,
  errorCode: input.errorCode,
  errorMessage: input.errorMessage || input.message,
  requiresManualReview: Boolean(input.requiresManualReview),
  retryable: Boolean(input.retryable),
  latestResolvedInventory: summarizeResolvedInventory(
    input.latestResolvedInventory || null,
  ),
});

export const normalizeProviderBookingError = (
  error: unknown,
  fallbackMessage: string,
): {
  errorCode: ProviderBookingErrorCode;
  errorMessage: string;
  retryable: boolean;
} => {
  const source = hasCode(error) ? error : null;
  const token = String(source?.errorCode || source?.code || "")
    .trim()
    .toUpperCase();
  const message =
    toNullableText(source?.message) ||
    (error instanceof Error ? toNullableText(error.message) : null) ||
    fallbackMessage;

  if (
    token.includes("INVENTORY") ||
    token.includes("UNAVAILABLE") ||
    token.includes("SOLD_OUT")
  ) {
    return {
      errorCode: "INVENTORY_UNAVAILABLE",
      errorMessage: message,
      retryable: false,
    };
  }

  if (token.includes("PRICE") || token.includes("RATE") || token.includes("FARE")) {
    return {
      errorCode: "PRICE_MISMATCH",
      errorMessage: message,
      retryable: false,
    };
  }

  if (
    token.includes("VALIDATION") ||
    token.includes("TRAVELER") ||
    token.includes("PASSENGER")
  ) {
    return {
      errorCode: "VALIDATION_ERROR",
      errorMessage: message,
      retryable: false,
    };
  }

  if (token.includes("PAYMENT") || token.includes("DECLIN")) {
    return {
      errorCode: "PAYMENT_DECLINED",
      errorMessage: message,
      retryable: false,
    };
  }

  if (token.includes("READ") || token.includes("RETRIEV")) {
    return {
      errorCode: "READ_UNAVAILABLE",
      errorMessage: message,
      retryable: false,
    };
  }

  if (token.includes("UNSUPPORTED")) {
    return {
      errorCode: "UNSUPPORTED_PROVIDER",
      errorMessage: message,
      retryable: false,
    };
  }

  if (token.includes("TIMEOUT") || token.includes("ABORT")) {
    return {
      errorCode: "TIMEOUT",
      errorMessage: message,
      retryable: true,
    };
  }

  if (
    token.includes("PROVIDER") ||
    token.includes("CONFIG") ||
    token.includes("DISABLED")
  ) {
    return {
      errorCode: "PROVIDER_UNAVAILABLE",
      errorMessage: message,
      retryable: true,
    };
  }

  return {
    errorCode: "UNKNOWN_PROVIDER_ERROR",
    errorMessage: message,
    retryable: false,
  };
};

export const prepareProviderCreateBooking = async (
  input: CreateProviderBookingInput,
  provider: string,
): Promise<
  | {
      ok: true;
      latestResolvedInventory: NonNullable<
        Awaited<ReturnType<typeof resolveInventoryRecord>>
      >;
      latestPrice: PriceQuote | null;
    }
  | {
      ok: false;
      result: CreateProviderBookingResult;
    }
> => {
  const latestResolvedInventory =
    input.latestResolvedInventory ||
    (await resolveInventoryRecord({
      inventoryId: input.canonicalInventoryId,
      provider,
      providerInventoryId: input.inventorySnapshot.providerInventoryId,
      checkedAt: input.inventorySnapshot.snapshotTimestamp,
    }));

  if (!latestResolvedInventory || latestResolvedInventory.isAvailable === false) {
    return {
      ok: false,
      result: buildFailureResult({
        provider,
        vertical: input.vertical,
        providerStatus: "inventory_unavailable",
        message: "The latest provider inventory is no longer available for booking.",
        errorCode: "INVENTORY_UNAVAILABLE",
        latestResolvedInventory,
      }),
    };
  }

  const snapshotPrice = buildSnapshotPriceQuote(input);
  if (!snapshotPrice) {
    return {
      ok: false,
      result: buildFailureResult({
        provider,
        vertical: input.vertical,
        providerStatus: "validation_error",
        message: "Booking could not start because the checkout pricing snapshot is incomplete.",
        errorCode: "VALIDATION_ERROR",
        latestResolvedInventory,
      }),
    };
  }

  const priceDrift = await detectPriceDrift(input.canonicalInventoryId, snapshotPrice, {
    provider,
    resolvedInventory: latestResolvedInventory.entity,
  });

  if (priceDrift.status === "price_changed") {
    return {
      ok: false,
      result: buildFailureResult({
        provider,
        vertical: input.vertical,
        providerStatus: "price_mismatch",
        message:
          "The live provider price changed after checkout revalidation and must be reviewed before booking.",
        errorCode: "PRICE_MISMATCH",
        responseSnapshot: {
          currentPrice: priceDrift.newPrice,
          snapshotPrice: priceDrift.oldPrice,
        },
        latestResolvedInventory,
      }),
    };
  }

  if (priceDrift.status === "unavailable") {
    return {
      ok: false,
      result: buildFailureResult({
        provider,
        vertical: input.vertical,
        providerStatus: "provider_unavailable",
        message: "Live provider pricing could not be confirmed for this booking request.",
        errorCode: "PROVIDER_UNAVAILABLE",
        retryable: true,
        latestResolvedInventory,
      }),
    };
  }

  return {
    ok: true,
    latestResolvedInventory,
    latestPrice: priceDrift.newPrice,
  };
};
