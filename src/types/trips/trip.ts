import type { AvailabilityConfidenceModel } from "~/lib/inventory/availability-confidence";
import type { InventoryFreshnessModel } from "~/lib/inventory/freshness";

export const TRIP_STATUSES = [
  "draft",
  "planning",
  "ready",
  "archived",
] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

export const TRIP_ITEM_TYPES = ["hotel", "flight", "car"] as const;
export type TripItemType = (typeof TRIP_ITEM_TYPES)[number];

export const TRIP_PRICE_DRIFT_STATUSES = [
  "increased",
  "decreased",
  "unchanged",
  "unavailable",
] as const;
export type TripPriceDriftStatus = (typeof TRIP_PRICE_DRIFT_STATUSES)[number];

export const TRIP_ITEM_VALIDITY_STATUSES = [
  "valid",
  "unavailable",
  "stale",
  "price_only_changed",
] as const;
export type TripItemValidityStatus =
  (typeof TRIP_ITEM_VALIDITY_STATUSES)[number];

export const TRIP_VALIDATION_SEVERITIES = ["warning", "blocking"] as const;
export type TripValidationSeverity =
  (typeof TRIP_VALIDATION_SEVERITIES)[number];

export const TRIP_INTELLIGENCE_STATUSES = [
  "valid_itinerary",
  "warnings_present",
  "blocking_issues_present",
] as const;
export type TripIntelligenceStatus =
  (typeof TRIP_INTELLIGENCE_STATUSES)[number];

export const TRIP_BUNDLING_PRIORITIES = ["high", "medium", "low"] as const;
export type TripBundlingPriority = (typeof TRIP_BUNDLING_PRIORITIES)[number];

export const TRIP_BUNDLING_GAP_TYPES = [
  "missing_return_flight",
  "missing_lodging",
  "arrival_ground_transport",
  "missing_car_rental",
  "date_coverage_gap",
  "large_idle_gap",
  "intercity_transfer_gap",
] as const;
export type TripBundlingGapType = (typeof TRIP_BUNDLING_GAP_TYPES)[number];

export const TRIP_BUNDLING_SUGGESTION_TYPES = [
  "add_return_flight",
  "add_hotel_near_arrival",
  "add_ground_transport_after_arrival",
  "add_car_rental_for_stay",
  "fill_missing_stay_dates",
  "add_connection_flight",
] as const;
export type TripBundlingSuggestionType =
  (typeof TRIP_BUNDLING_SUGGESTION_TYPES)[number];

export type TripValidationIssue = {
  code: string;
  scope: "availability" | "itinerary";
  severity: TripValidationSeverity;
  message: string;
  itemId?: number;
  relatedItemIds?: number[];
};

export type TripItemCandidate = {
  itemType: TripItemType;
  inventoryId: number;
  startDate?: string;
  endDate?: string;
  priceCents?: number;
  currencyCode?: string;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  meta?: string[];
  metadata?: Record<string, unknown>;
};

export type TripListItem = {
  id: number;
  name: string;
  status: TripStatus;
  itemCount: number;
  startDate: string | null;
  endDate: string | null;
  estimatedTotalCents: number;
  currencyCode: string;
  hasMixedCurrencies: boolean;
  updatedAt: string;
};

export type TripVerticalPricing = {
  itemType: TripItemType;
  itemCount: number;
  currencyCode: string | null;
  snapshotSubtotalCents: number | null;
  currentSubtotalCents: number | null;
  priceDeltaCents: number | null;
  hasMixedCurrencies: boolean;
  hasPartialPricing: boolean;
};

export type TripPricingSummary = {
  currencyCode: string | null;
  snapshotTotalCents: number | null;
  currentTotalCents: number | null;
  priceDeltaCents: number | null;
  hasMixedCurrencies: boolean;
  hasPartialPricing: boolean;
  driftCounts: Record<TripPriceDriftStatus, number>;
  verticals: TripVerticalPricing[];
};

export type TripItem = {
  id: number;
  tripId: number;
  itemType: TripItemType;
  position: number;
  locked: boolean;
  title: string;
  subtitle: string | null;
  startDate: string | null;
  endDate: string | null;
  snapshotPriceCents: number;
  snapshotCurrencyCode: string;
  snapshotTimestamp: string;
  currentPriceCents: number | null;
  currentCurrencyCode: string | null;
  priceDriftStatus: TripPriceDriftStatus;
  priceDriftCents: number | null;
  availabilityConfidence: AvailabilityConfidenceModel;
  freshness?: InventoryFreshnessModel;
  availabilityStatus: TripItemValidityStatus;
  availabilityCheckedAt: string | null;
  availabilityExpiresAt: string | null;
  imageUrl: string | null;
  meta: string[];
  issues: TripValidationIssue[];
  startCityName: string | null;
  endCityName: string | null;
  liveCarLocationType: "airport" | "city" | null;
  liveCarLocationName: string | null;
  hotelId: number | null;
  flightItineraryId: number | null;
  carInventoryId: number | null;
  liveFlightServiceDate: string | null;
  liveFlightDepartureAt: string | null;
  liveFlightArrivalAt: string | null;
  liveFlightItineraryType: "one-way" | "round-trip" | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type TripEditingState = {
  autoRebalance: boolean;
  lockedItemCount: number;
};

export type TripIntelligenceSummary = {
  status: TripIntelligenceStatus;
  checkedAt: string | null;
  expiresAt: string | null;
  itemStatusCounts: Record<TripItemValidityStatus, number>;
  issueCounts: {
    warning: number;
    blocking: number;
  };
  issues: TripValidationIssue[];
};

export type TripBundlingGap = {
  id: string;
  gapType: TripBundlingGapType;
  priority: TripBundlingPriority;
  targetItemType: TripItemType;
  title: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  cityId: number | null;
  cityName: string | null;
  originCityId: number | null;
  originCityName: string | null;
  destinationCityId: number | null;
  destinationCityName: string | null;
  relatedItemIds: number[];
};

export type TripBundlingInventoryReference = {
  inventoryId: number;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  priceCents: number;
  currencyCode: string;
  meta: string[];
  href: string | null;
  availabilityConfidence: AvailabilityConfidenceModel;
  freshness?: InventoryFreshnessModel;
};

export type TripBundlingSuggestion = {
  id: string;
  gapId: string;
  suggestionType: TripBundlingSuggestionType;
  priority: TripBundlingPriority;
  itemType: TripItemType;
  title: string;
  description: string;
  ctaLabel: string;
  startDate: string | null;
  endDate: string | null;
  cityName: string | null;
  inventory: TripBundlingInventoryReference;
  tripCandidate: TripItemCandidate;
};

export type TripBundlingSummary = {
  generatedAt: string;
  gaps: TripBundlingGap[];
  suggestions: TripBundlingSuggestion[];
};

export type TripDetails = TripListItem & {
  notes: string | null;
  metadata: Record<string, unknown>;
  editing: TripEditingState;
  citiesInvolved: string[];
  pricing: TripPricingSummary;
  intelligence: TripIntelligenceSummary;
  bundling: TripBundlingSummary;
  items: TripItem[];
};

export type TripItemReplacementOption = {
  inventoryId: number;
  itemType: TripItemType;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  meta: string[];
  priceCents: number;
  currencyCode: string;
  startDate: string | null;
  endDate: string | null;
  candidate: TripItemCandidate;
  reasons: string[];
};

export type TripEditPreviewActionType = "reorder" | "remove" | "replace";

export type TripChangeSafetyLevel = "minor" | "major";

export type TripChangeSummary = {
  safetyLevel: TripChangeSafetyLevel;
  headline: string;
  whatChanged: string;
  whyChanged: string;
  impactSummary: string;
};

export type TripRollbackItemSnapshot = {
  id: number;
  itemType: TripItemType;
  position: number;
  hotelId: number | null;
  flightItineraryId: number | null;
  carInventoryId: number | null;
  startCityId: number | null;
  endCityId: number | null;
  startDate: string | null;
  endDate: string | null;
  snapshotPriceCents: number;
  snapshotCurrencyCode: string;
  snapshotTimestamp: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  meta: string[];
  metadata: Record<string, unknown>;
};

export type TripRollbackDraft = {
  items: TripRollbackItemSnapshot[];
};

export type TripEditTimingChange = {
  itemId: number;
  title: string;
  kind: "position" | "schedule" | "position_and_schedule";
  previousLabel: string;
  nextLabel: string;
};

export type TripEditPriceImpact = {
  currencyCode: string | null;
  snapshotDeltaCents: number | null;
  currentDeltaCents: number | null;
  summary: string;
};

export type TripEditCoherenceImpact = {
  status: "improved" | "unchanged" | "riskier" | "mixed";
  blockingDelta: number;
  warningDelta: number;
  summary: string;
};

export type TripEditTimingImpact = {
  summary: string;
  changedItems: TripEditTimingChange[];
};

export type TripEditPreview = {
  actionType: TripEditPreviewActionType;
  trip: TripDetails;
  autoRebalanced: boolean;
  changeSummary: TripChangeSummary;
  lockedItemIdsPreserved: number[];
  limitations: string[];
  priceImpact: TripEditPriceImpact;
  timingImpact: TripEditTimingImpact;
  coherenceImpact: TripEditCoherenceImpact;
};

export type TripAppliedChange = {
  summary: TripChangeSummary;
  preview: TripEditPreview;
  rollbackDraft: TripRollbackDraft | null;
};
