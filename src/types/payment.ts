export const PAYMENT_PROVIDERS = ["stripe"] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const PAYMENT_INTENT_STATUSES = [
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
  "processing",
  "requires_capture",
  "succeeded",
  "canceled",
  "failed",
] as const;
export type PaymentIntentStatus = (typeof PAYMENT_INTENT_STATUSES)[number];

export const CHECKOUT_PAYMENT_SESSION_STATUSES = [
  "draft",
  "pending",
  "requires_action",
  "authorized",
  "succeeded",
  "canceled",
  "failed",
  "expired",
] as const;
export type CheckoutPaymentSessionStatus =
  (typeof CHECKOUT_PAYMENT_SESSION_STATUSES)[number];

export type PaymentAmountSnapshotItem = {
  tripItemId: number;
  inventoryId: string;
  totalAmountCents: number | null;
  currency: string | null;
};

export type PaymentAmountSnapshot = {
  source: "checkout_snapshot" | "revalidated_totals";
  currency: string;
  baseAmountCents: number | null;
  taxesAmountCents: number | null;
  feesAmountCents: number | null;
  totalAmountCents: number;
  itemCount: number;
  items: PaymentAmountSnapshotItem[];
};

export type CreatePaymentIntentInput = {
  checkoutSessionId: string;
  amountSnapshot: PaymentAmountSnapshot;
  currency: string;
  metadata?: Record<string, string>;
};

export type CreatePaymentIntentResult = {
  provider: PaymentProvider;
  providerPaymentIntentId: string;
  status: PaymentIntentStatus;
  clientSecret: string | null;
  amount: number;
  currency: string;
  metadata: Record<string, unknown> | null;
};

export type CheckoutPaymentSession = {
  id: string;
  checkoutSessionId: string;
  provider: PaymentProvider;
  status: CheckoutPaymentSessionStatus;
  paymentIntentStatus: PaymentIntentStatus;
  currency: string;
  amountSnapshot: PaymentAmountSnapshot;
  revalidationFingerprint: string;
  providerPaymentIntentId: string;
  providerClientSecret: string | null;
  providerMetadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  authorizedAt: string | null;
  succeededAt: string | null;
  failedAt: string | null;
  canceledAt: string | null;
  expiresAt: string | null;
};

export type CheckoutPaymentSummary = {
  checkoutSessionId: string;
  checkoutReady: boolean;
  blockedReason: string | null;
  paymentSessionId: string | null;
  provider: PaymentProvider | null;
  status: CheckoutPaymentSessionStatus | null;
  statusLabel: string;
  statusDescription: string;
  paymentIntentStatus: PaymentIntentStatus | null;
  currency: string | null;
  amountSnapshot: PaymentAmountSnapshot | null;
  amountLabel: string;
  revalidationFingerprint: string | null;
  fingerprintMatchesCheckout: boolean | null;
  clientSecret: string | null;
  canInitialize: boolean;
  canResume: boolean;
  canCancel: boolean;
  canRefresh: boolean;
  updatedAt: string | null;
  updatedLabel: string | null;
};
