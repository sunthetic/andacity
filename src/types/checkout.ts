import type { BookableEntity, BookableVertical } from "~/types/bookable-entity";
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

export type CheckoutSession = {
  id: string;
  tripId: number;
  status: CheckoutSessionStatus;
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
  canProceed: boolean;
};

export type CreateCheckoutSessionInput = {
  trip: TripDetails;
  now?: Date | string | null;
  ttlMs?: number;
};

export type CreateCheckoutSessionResult = {
  session: CheckoutSession;
  createdNew: boolean;
  redirectHref: string;
};
