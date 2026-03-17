import type { AvailabilityConfidenceModel } from "~/lib/inventory/availability-confidence";
import type { InventoryFreshnessModel } from "~/lib/inventory/freshness";
import type { BookableEntity } from "~/types/bookable-entity";

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

export const TRIP_ITEM_ISSUE_CODES = [
  "inventory_missing",
  "inventory_unavailable",
  "sold_out",
  "price_changed",
  "currency_changed",
  "date_changed",
  "inventory_mismatch",
  "snapshot_incomplete",
  "revalidation_failed",
] as const;
export type TripItemIssueCode = (typeof TRIP_ITEM_ISSUE_CODES)[number];

export type TripItemIssueSeverity = TripValidationSeverity;

export type TripItemIssue = {
  code: TripItemIssueCode;
  severity: TripItemIssueSeverity;
  message: string;
};

export const TRIP_ITEM_REVALIDATION_STATUSES = [
  "valid",
  "price_changed",
  "unavailable",
  "error",
] as const;
export type TripItemRevalidationStatus =
  (typeof TRIP_ITEM_REVALIDATION_STATUSES)[number];

export const TRIP_REVALIDATION_SUMMARY_STATUSES = [
  "all_valid",
  "price_changes_present",
  "unavailable_items_present",
  "errors_present",
] as const;
export type TripRevalidationSummaryStatus =
  (typeof TRIP_REVALIDATION_SUMMARY_STATUSES)[number];

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

export const TRIP_BUNDLING_EXPLANATION_STRENGTHS = [
  "strong",
  "moderate",
  "tentative",
] as const;
export type TripBundlingExplanationStrength =
  (typeof TRIP_BUNDLING_EXPLANATION_STRENGTHS)[number];

export const TRIP_BUNDLING_PRICE_POSITIONS = [
  "lowest_exact_match",
  "above_lowest_exact_match",
  "unknown",
] as const;
export type TripBundlingPricePosition =
  (typeof TRIP_BUNDLING_PRICE_POSITIONS)[number];

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
  inventoryId: string;
  providerInventoryId?: number;
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

export type TripItemHotelAvailabilitySnapshot = {
  itemType: "hotel";
  source: "hotel_availability_snapshot";
  snapshotTimestamp: string | null;
  hotelAvailabilitySnapshotId: number | null;
  checkInStart: string | null;
  checkInEnd: string | null;
  minNights: number | null;
  maxNights: number | null;
  blockedWeekdays: number[];
};

export type TripItemCarAvailabilitySnapshot = {
  itemType: "car";
  source: "car_inventory";
  snapshotTimestamp: string | null;
  availabilityStart: string | null;
  availabilityEnd: string | null;
  minDays: number | null;
  maxDays: number | null;
  blockedWeekdays: number[];
  locationType: "airport" | "city" | null;
  locationName: string | null;
};

export type TripItemFlightAvailabilitySnapshot = {
  itemType: "flight";
  source: "flight_inventory";
  snapshotTimestamp: string | null;
  serviceDate: string | null;
  departureAt: string | null;
  arrivalAt: string | null;
  seatsRemaining: number | null;
  itineraryType: "one-way" | "round-trip" | null;
};

export type TripItemAvailabilitySnapshot =
  | TripItemHotelAvailabilitySnapshot
  | TripItemCarAvailabilitySnapshot
  | TripItemFlightAvailabilitySnapshot;

export type TripItemInventorySnapshot = {
  id: number | null;
  providerInventoryId: number | null;
  hotelAvailabilitySnapshotId: number | null;
  bookableEntity: BookableEntity | null;
  availability: TripItemAvailabilitySnapshot | null;
};

export type TripItem = {
  id: number;
  tripId: number;
  itemType: TripItemType;
  inventoryId: string;
  bookingSessionId: string | null;
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
  revalidation: TripItemRevalidationResult;
  bookableEntity?: BookableEntity | null;
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
  inventorySnapshot: TripItemInventorySnapshot | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type TripItemRevalidationResult = {
  itemId: number;
  inventoryId: string | null;
  checkedAt: string;
  status: TripItemRevalidationStatus;
  message: string | null;
  currentPriceCents: number | null;
  currentCurrencyCode: string | null;
  snapshotPriceCents: number | null;
  snapshotCurrencyCode: string | null;
  priceDeltaCents: number | null;
  isAvailable: boolean | null;
  issues: TripItemIssue[];
};

export type TripRevalidationSummary = {
  status: TripRevalidationSummaryStatus;
  checkedAt: string | null;
  expiresAt: string | null;
  itemStatusCounts: Record<TripItemRevalidationStatus, number>;
  summary: string;
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
  inventoryId: string;
  providerInventoryId?: number;
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

export type TripBundlingSavingsBreakdown = {
  currencyCode: string;
  currentTripBaseTotalCents: number | null;
  addedComponentBaseCents: number;
  projectedBundleBaseTotalCents: number | null;
  selectedComponentBaseCents: number;
  cheapestExactMatchBaseCents: number | null;
  deltaFromCheapestExactMatchCents: number | null;
  pricePosition: TripBundlingPricePosition;
  summary: string;
};

export type TripBundlingStrengthIndicator = {
  level: TripBundlingExplanationStrength;
  label: string;
  reason: string;
};

export type TripBundlingExplanation = {
  summary: string;
  why: string[];
  savings: TripBundlingSavingsBreakdown;
  constraints: string[];
  tradeoffs: string[];
  strength: TripBundlingStrengthIndicator;
  missingSignals: string[];
};

export type TripBundlingPricingContext = {
  currencyCode: string | null;
  snapshotTotalCents: number | null;
  hasMixedCurrencies: boolean;
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
  explanation: TripBundlingExplanation;
  inventory: TripBundlingInventoryReference;
  tripCandidate: TripItemCandidate;
};

export type TripBundlingSummary = {
  generatedAt: string;
  gaps: TripBundlingGap[];
  suggestions: TripBundlingSuggestion[];
};

export type TripDetails = TripListItem & {
  bookingSessionId: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  editing: TripEditingState;
  citiesInvolved: string[];
  pricing: TripPricingSummary;
  revalidation: TripRevalidationSummary;
  intelligence: TripIntelligenceSummary;
  bundling: TripBundlingSummary;
  items: TripItem[];
};

export type TripItemReplacementOption = {
  inventoryId: string;
  providerInventoryId?: number;
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
  inventoryId: string;
  bookingSessionId: string | null;
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
  inventorySnapshot: Omit<TripItemInventorySnapshot, "id"> | null;
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

export type TripEditBundleImpact = {
  selectionMode: "recommended" | "manual_override";
  summary: string;
  preservedRelatedItemIds: number[];
  strengthSummary: string;
  savingsDeltaCents: number | null;
  savingsSummary: string;
  explanation: TripBundlingExplanation | null;
  limitations: string[];
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
  bundleImpact: TripEditBundleImpact | null;
};

export type TripAppliedChange = {
  summary: TripChangeSummary;
  preview: TripEditPreview;
  rollbackDraft: TripRollbackDraft | null;
};
