import { isConfirmationRef } from "~/types/confirmation";
import { isItineraryRef } from "~/types/itinerary";
import type { ResumeTarget } from "~/fns/retrieval/types";

const buildBasePathFromRef = (ref: string): string | null => {
  if (isConfirmationRef(ref)) {
    return `/confirmation/${ref}`;
  }

  if (isItineraryRef(ref)) {
    return `/itinerary/${ref}`;
  }

  return null;
};

const buildBasePathFromTarget = (target: ResumeTarget): string | null => {
  if (!target.ref) return null;

  if (target.type === "confirmation") {
    return `/confirmation/${target.ref}`;
  }

  if (target.type === "itinerary" || target.type === "claim") {
    return `/itinerary/${target.ref}`;
  }

  if (target.type === "recovery") {
    if (target.surface === "confirmation") {
      return `/confirmation/${target.ref}`;
    }

    if (target.surface === "itinerary") {
      return `/itinerary/${target.ref}`;
    }

    return buildBasePathFromRef(target.ref);
  }

  return null;
};

export const getResumeRedirectUrl = (
  target: ResumeTarget,
  sourceUrl?: URL,
): string | null => {
  if (target.type === "not_found") return null;

  const basePath = buildBasePathFromTarget(target);
  if (!basePath) return null;

  const params = new URLSearchParams(sourceUrl?.search || "");
  params.delete("resume");
  params.delete("resume_reason");
  params.delete("resume_claim");
  params.delete("resume_recovery");

  if (target.type === "claim") {
    params.set("resume", "claim");
  } else if (target.type === "recovery") {
    params.set("resume", "recovery");
  }

  if (target.requiresClaim) {
    params.set("resume_claim", "1");
  }

  if (target.requiresRecovery) {
    params.set("resume_recovery", "1");
  }

  params.set("resume_reason", target.reason);

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
};
