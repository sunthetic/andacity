import type { AvailabilityConfidenceModel } from "~/lib/inventory/availability-confidence";
import type { InventoryFreshnessModel } from "~/lib/inventory/freshness";

export type HotelEntityPageKind =
  | "resolved"
  | "unavailable"
  | "revalidation_required"
  | "not_found"
  | "invalid_route"
  | "resolution_error";

export type HotelEntityBreadcrumbModel = {
  label: string;
  href?: string;
};

export type HotelEntityHeaderModel = {
  badge: string;
  title: string;
  description: string;
  tone: "neutral" | "warning" | "critical";
};

export type HotelEntitySummaryModel = {
  hotelName: string;
  brandLabel: string | null;
  providerLabel: string | null;
  locationLabel: string;
  addressLabel: string | null;
  propertyTypeLabel: string | null;
  starRatingLabel: string | null;
  guestScoreLabel: string | null;
  reviewCountLabel: string | null;
  stayDateRangeLabel: string;
  stayLengthLabel: string | null;
  occupancyLabel: string | null;
  roomLabel: string;
  imageUrl: string | null;
  summaryText: string | null;
};

export type HotelOfferSummaryModel = {
  roomTypeLabel: string;
  ratePlanLabel: string | null;
  boardTypeLabel: string | null;
  bedConfigurationLabel: string | null;
  roomSizeLabel: string | null;
  occupancyLabel: string | null;
  cancellationSummary: string;
  includedFeatures: string[];
};

export type HotelAmenitiesListModel = {
  title: string;
  items: string[];
  emptyLabel: string;
};

export type HotelPoliciesSummaryModel = {
  refundabilityLabel: string;
  freeCancellationLabel: string | null;
  payLaterLabel: string | null;
  cancellationLabel: string | null;
  checkInLabel: string | null;
  checkOutLabel: string | null;
  notes: string[];
};

export type HotelPriceSummaryModel = {
  totalPriceLabel: string;
  nightlyPriceLabel: string | null;
  taxesFeesLabel: string | null;
  basePriceLabel: string | null;
  currencyCode: string | null;
  stayLengthLabel: string | null;
  priceNote: string | null;
};

export type HotelEntityStatusModel = {
  availability: AvailabilityConfidenceModel;
  freshness: InventoryFreshnessModel;
  providerLabel: string;
  requestedInventoryId: string;
  resolvedInventoryId: string | null;
  canonicalPath: string;
  checkedAtLabel: string;
};

export type HotelEntityCtaModel = {
  label: string;
  disabled: boolean;
  note: string;
  inventoryId: string;
  canonicalPath: string;
};

export type HotelEntityDetailItemModel = {
  label: string;
  value: string;
};

export type HotelEntityUnavailableStateModel = {
  badge: string;
  title: string;
  description: string;
  tone: "warning" | "critical";
  primaryAction: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  detailItems: HotelEntityDetailItemModel[];
};

export type HotelEntityErrorStateModel = {
  badge: string;
  title: string;
  description: string;
  primaryAction: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  detailItems: HotelEntityDetailItemModel[];
};

export type HotelEntityPageUiModel = {
  kind: HotelEntityPageKind;
  breadcrumbs: HotelEntityBreadcrumbModel[];
  header: HotelEntityHeaderModel;
  summary: HotelEntitySummaryModel | null;
  status: HotelEntityStatusModel | null;
  offerSummary: HotelOfferSummaryModel | null;
  amenities: HotelAmenitiesListModel | null;
  policies: HotelPoliciesSummaryModel | null;
  priceSummary: HotelPriceSummaryModel | null;
  cta: HotelEntityCtaModel | null;
  unavailableState: HotelEntityUnavailableStateModel | null;
  errorState: HotelEntityErrorStateModel | null;
};
