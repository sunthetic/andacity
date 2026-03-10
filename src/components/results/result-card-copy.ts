import type { FlightSortKey } from "~/lib/search/flights/flight-sort-options";
import type { HotelSortKey } from "~/lib/search/hotels/hotel-sort-options";
import type { CarRentalsSortKey } from "~/lib/search/car-rentals/car-sort-options";
import type { AvailabilityConfidenceModel } from "~/lib/inventory/availability-confidence";

export const buildHotelWhyThis = (
  input: {
    rating: number;
    reviewCount: number;
    priceFrom: number;
    stars: number;
    freeCancellation: boolean;
    payLater: boolean;
  },
  activeSort: HotelSortKey | null | undefined,
) => {
  if (activeSort !== "recommended") return null;

  const reasons: string[] = [];

  if (input.rating >= 4.5) {
    reasons.push(`${input.rating.toFixed(1)} guest rating`);
  } else if (input.reviewCount >= 500) {
    reasons.push(`${input.reviewCount.toLocaleString("en-US")} guest reviews`);
  }

  if (input.freeCancellation) reasons.push("free cancellation");
  if (input.payLater) reasons.push("pay later");

  if (input.priceFrom <= 200) {
    reasons.push("competitive nightly pricing");
  } else if (input.priceFrom <= 320) {
    reasons.push("balanced nightly pricing");
  }

  if (!reasons.length) {
    reasons.push(`${input.stars}-star stay`);
  }

  return `Recommended for its ${joinReasons(reasons.slice(0, 3))}.`;
};

export const buildCarWhyThis = (
  input: {
    rating: number;
    reviewCount: number;
    priceFrom: number;
    freeCancellation: boolean;
    payAtCounter: boolean;
    pickupType?: "airport" | "city" | null;
  },
  activeSort: CarRentalsSortKey | null | undefined,
) => {
  if (activeSort !== "recommended") return null;

  const reasons: string[] = [];

  if (input.rating >= 4.4) {
    reasons.push(`${input.rating.toFixed(1)} renter rating`);
  } else if (input.reviewCount >= 400) {
    reasons.push(`${input.reviewCount.toLocaleString("en-US")} recent reviews`);
  }

  if (input.freeCancellation) reasons.push("free cancellation");
  if (input.payAtCounter) reasons.push("pay-at-counter terms");

  if (input.pickupType === "airport") {
    reasons.push("airport pickup");
  }

  if (input.priceFrom <= 65) {
    reasons.push("competitive daily pricing");
  }

  if (!reasons.length) {
    reasons.push("balanced policy and pickup signals");
  }

  return `Recommended for its ${joinReasons(reasons.slice(0, 3))}.`;
};

export const buildFlightWhyThis = (
  input: {
    stops: number;
    duration: string;
    price: number;
    availabilityConfidence?: AvailabilityConfidenceModel | null;
  },
  activeSort: FlightSortKey | null | undefined,
) => {
  if (activeSort !== "recommended") return null;

  const reasons: string[] = [];

  if (input.stops === 0) {
    reasons.push("nonstop routing");
  } else if (input.stops === 1) {
    reasons.push("one-stop itinerary");
  }

  if (input.duration) {
    reasons.push(`${input.duration} travel time`);
  }

  if (input.price <= 250) {
    reasons.push("competitive fare");
  }

  if (input.availabilityConfidence?.match === "exact") {
    reasons.push("exact date match");
  }

  if (!reasons.length) {
    reasons.push("balanced fare and schedule");
  }

  return `Recommended for its ${joinReasons(reasons.slice(0, 3))}.`;
};

const joinReasons = (parts: string[]) => {
  if (parts.length <= 1) return parts[0] || "";
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
};
