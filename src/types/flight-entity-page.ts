import type { AvailabilityConfidenceModel } from "~/lib/inventory/availability-confidence";
import type { InventoryFreshnessModel } from "~/lib/inventory/freshness";

export type FlightEntityPageKind =
  | "resolved"
  | "unavailable"
  | "revalidation_required"
  | "not_found"
  | "invalid_route"
  | "resolution_error";

export type FlightEntityBreadcrumbModel = {
  label: string;
  href?: string;
};

export type FlightEntityHeaderModel = {
  badge: string;
  title: string;
  description: string;
  tone: "neutral" | "warning" | "critical";
};

export type FlightEntitySummaryModel = {
  airlineLabel: string;
  providerLabel: string | null;
  routeLabel: string;
  departureAirportLabel: string;
  arrivalAirportLabel: string;
  departureTimeLabel: string;
  arrivalTimeLabel: string;
  durationLabel: string;
  stopSummary: string;
  itineraryTypeLabel: string | null;
};

export type FlightEntitySegmentModel = {
  id: string;
  segmentLabel: string;
  flightNumberLabel: string;
  airlineLabel: string;
  operatingAirlineLabel: string | null;
  aircraftLabel: string | null;
  departureAirportLabel: string;
  arrivalAirportLabel: string;
  departureTimeLabel: string;
  arrivalTimeLabel: string;
  durationLabel: string;
  layoverAfterLabel: string | null;
};

export type FlightFareSummaryModel = {
  cabinClassLabel: string;
  fareCodeLabel: string | null;
  refundabilityLabel: string;
  changeabilityLabel: string | null;
  baggageLabel: string;
  totalPriceLabel: string;
  currencyCode: string | null;
  seatsRemainingLabel: string | null;
  priceNote: string | null;
};

export type FlightEntityStatusModel = {
  availability: AvailabilityConfidenceModel;
  freshness: InventoryFreshnessModel;
  providerLabel: string;
  requestedInventoryId: string;
  resolvedInventoryId: string | null;
  canonicalPath: string;
  checkedAtLabel: string;
};

export type FlightEntityCtaModel = {
  label: string;
  disabled: boolean;
  note: string;
};

export type FlightEntityDetailItemModel = {
  label: string;
  value: string;
};

export type FlightEntityUnavailableStateModel = {
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
  detailItems: FlightEntityDetailItemModel[];
};

export type FlightEntityErrorStateModel = {
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
  detailItems: FlightEntityDetailItemModel[];
};

export type FlightEntityPageUiModel = {
  kind: FlightEntityPageKind;
  breadcrumbs: FlightEntityBreadcrumbModel[];
  header: FlightEntityHeaderModel;
  summary: FlightEntitySummaryModel | null;
  status: FlightEntityStatusModel | null;
  segments: FlightEntitySegmentModel[];
  fareSummary: FlightFareSummaryModel | null;
  cta: FlightEntityCtaModel | null;
  unavailableState: FlightEntityUnavailableStateModel | null;
  errorState: FlightEntityErrorStateModel | null;
};
