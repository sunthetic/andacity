import type { AvailabilityConfidenceModel } from "~/lib/inventory/availability-confidence";
import type { InventoryFreshnessModel } from "~/lib/inventory/freshness";

export type CarEntityPageKind =
  | "resolved"
  | "unavailable"
  | "revalidation_required"
  | "not_found"
  | "invalid_route"
  | "resolution_error";

export type CarEntityBreadcrumbModel = {
  label: string;
  href?: string;
};

export type CarEntityHeaderModel = {
  badge: string;
  title: string;
  description: string;
  tone: "neutral" | "warning" | "critical";
};

export type CarEntitySummaryModel = {
  vehicleName: string;
  categoryLabel: string;
  rentalCompanyLabel: string | null;
  providerLabel: string | null;
  pickupLocationLabel: string;
  dropoffLocationLabel: string;
  pickupDateTimeLabel: string;
  dropoffDateTimeLabel: string;
  rentalLengthLabel: string | null;
  ratePlanLabel: string | null;
  imageUrl: string | null;
  summaryText: string | null;
};

export type CarVehicleSpecsModel = {
  vehicleClassLabel: string;
  transmissionLabel: string;
  passengerCapacityLabel: string;
  baggageCapacityLabel: string;
  doorCountLabel: string | null;
  airConditioningLabel: string | null;
  fuelPolicyLabel: string | null;
  mileagePolicyLabel: string | null;
  ratePlanLabel: string | null;
  highlights: string[];
};

export type CarRentalPoliciesModel = {
  cancellationSummary: string;
  paymentLabel: string | null;
  depositLabel: string | null;
  minimumDriverAgeLabel: string | null;
  quotedDriverAgeLabel: string | null;
  feesLabel: string | null;
  notes: string[];
};

export type CarPickupDropoffSummaryModel = {
  pickupLocationLabel: string;
  pickupTypeLabel: string | null;
  pickupAddressLabel: string | null;
  pickupDateTimeLabel: string;
  dropoffLocationLabel: string;
  dropoffTypeLabel: string | null;
  dropoffAddressLabel: string | null;
  dropoffDateTimeLabel: string;
  rentalLengthLabel: string | null;
};

export type CarPriceSummaryModel = {
  totalPriceLabel: string;
  dailyPriceLabel: string | null;
  taxesFeesLabel: string | null;
  basePriceLabel: string | null;
  currencyCode: string | null;
  rentalLengthLabel: string | null;
  priceNote: string | null;
};

export type CarEntityStatusModel = {
  availability: AvailabilityConfidenceModel;
  freshness: InventoryFreshnessModel;
  providerLabel: string;
  requestedInventoryId: string;
  resolvedInventoryId: string | null;
  canonicalPath: string;
  checkedAtLabel: string;
};

export type CarEntityCtaModel = {
  label: string;
  disabled: boolean;
  note: string;
  inventoryId: string;
  canonicalPath: string;
};

export type CarEntityDetailItemModel = {
  label: string;
  value: string;
};

export type CarEntityUnavailableStateModel = {
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
  detailItems: CarEntityDetailItemModel[];
};

export type CarEntityErrorStateModel = {
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
  detailItems: CarEntityDetailItemModel[];
};

export type CarEntityPageUiModel = {
  kind: CarEntityPageKind;
  breadcrumbs: CarEntityBreadcrumbModel[];
  header: CarEntityHeaderModel;
  summary: CarEntitySummaryModel | null;
  status: CarEntityStatusModel | null;
  vehicleSpecs: CarVehicleSpecsModel | null;
  policies: CarRentalPoliciesModel | null;
  pickupDropoff: CarPickupDropoffSummaryModel | null;
  priceSummary: CarPriceSummaryModel | null;
  cta: CarEntityCtaModel | null;
  unavailableState: CarEntityUnavailableStateModel | null;
  errorState: CarEntityErrorStateModel | null;
};
