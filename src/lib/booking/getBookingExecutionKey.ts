import { createHash } from "node:crypto";
import type { CheckoutSession } from "~/types/checkout";
import type { CheckoutPaymentSession } from "~/types/payment";

const stableSerialize = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableSerialize(entry)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
};

export const getBookingExecutionKey = (
  checkoutSession: CheckoutSession,
  paymentSession: CheckoutPaymentSession,
) => {
  const payload = {
    checkoutSessionId: checkoutSession.id,
    paymentSessionId: paymentSession.id,
    revalidationFingerprint: paymentSession.revalidationFingerprint,
    lastRevalidatedAt: checkoutSession.lastRevalidatedAt,
    revalidationCheckedAt: checkoutSession.revalidationSummary?.checkedAt || null,
    amountSnapshot: paymentSession.amountSnapshot,
    items: checkoutSession.items.map((item) => ({
      tripItemId: item.tripItemId,
      inventoryId: item.inventory.inventoryId,
      snapshotTimestamp: item.snapshotTimestamp,
      totalAmountCents: item.pricing.totalAmountCents,
      provider: item.inventory.providerMetadata?.provider || null,
    })),
  };

  return createHash("sha256").update(stableSerialize(payload)).digest("hex");
};
