import type { BookingConfirmation } from "~/types/confirmation";
import type { OwnedItinerary, ItinerarySummary } from "~/types/itinerary";
import type { ItineraryAccessResult } from "~/types/ownership";
import type { RecoveryState } from "~/types/recovery";

export type RetrievalRefType = "confirmation" | "itinerary" | "unknown";

export type TripByAnyRefResult = {
  incomingRef: string;
  incomingRefType: RetrievalRefType;
  matchedRefType: Exclude<RetrievalRefType, "unknown"> | null;
  confirmation: BookingConfirmation | null;
  itinerary: OwnedItinerary | null;
};

export type ResumeTargetType =
  | "confirmation"
  | "itinerary"
  | "claim"
  | "recovery"
  | "not_found";

export type ResumeTarget = {
  type: ResumeTargetType;
  ref: string | null;
  reason: string;
  requiresClaim: boolean;
  requiresRecovery: boolean;
  surface: "confirmation" | "itinerary" | null;
};

export type ResolveResumeFlowResult = {
  incomingRef: string;
  incomingRefType: RetrievalRefType;
  confirmation: BookingConfirmation | null;
  itinerary: OwnedItinerary | null;
  access: ItineraryAccessResult | null;
  recoveryState: RecoveryState | null;
  target: ResumeTarget;
};

export type RecentItineraryList = {
  ownerType: "user" | "session";
  ownerId: string;
  itineraries: ItinerarySummary[];
};
